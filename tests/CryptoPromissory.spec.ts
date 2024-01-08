import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from 'ton-core';
import { PromissoryMaster } from '../wrappers/PromissoryMaster';
import '@ton/test-utils';
import { Promissory } from '../wrappers/Promissory';
import { stringify } from 'querystring';

describe('Crypto Promissory Tests', () => {
    const minTonForStorage = toNano("0.3")

    let blockchain: Blockchain;
    let promissoryMaster: SandboxContract<PromissoryMaster>;
    let promissory: SandboxContract<Promissory>
    let deployer: SandboxContract<TreasuryContract>;
    let holder: SandboxContract<TreasuryContract>;
    let drawer: SandboxContract<TreasuryContract>;
    let newHolder: SandboxContract<TreasuryContract>;

    let promissoryAmount = 4321n
    let promissoryFee = 2n
    let dateOfClose = 1707013424n

    const replacer = (key: any, value: any) =>
        typeof value === "bigint" ? value.toString() : value;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        promissoryMaster = blockchain.openContract(await PromissoryMaster.fromInit());
        deployer = await blockchain.treasury('deployer');
        holder = await blockchain.treasury('holder')
        drawer = await blockchain.treasury('drawer')
        newHolder = await blockchain.treasury('newHolder')

        await promissoryMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        await promissoryMaster.send(drawer.getSender(), {
            value: toNano("0.3")
        }, {
            $$type: 'Mint',
            holder: holder.address,
            promissoryAmount: promissoryAmount,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose
        })

        promissory = blockchain.openContract(Promissory.fromAddress(await promissoryMaster.getPromissoryAddressByIndex(0n)))
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });

    it("create (mint) promissory", async () => {
        let promissoryInfo = await promissory.getPromissoryInfo();
        let validPromissoryInfo = {
            '$$type': 'PromissoryInfo',
            drawer: drawer.address,
            holder: holder.address,
            id: 0n,
            promissoryAmount: promissoryAmount,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: false
        } 

        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    });

    it('promissory transfer', async () => {
        await promissory.send(holder.getSender(), {
            value: toNano("0.3")
        }, {
            $$type: 'Transfer',
            queryId: 0n,
            newHolder: newHolder.address
        })
        
        let promissoryInfo = await promissory.getPromissoryInfo()
        let validPromissoryInfo = {
            '$$type': 'PromissoryInfo',
            drawer: drawer.address,
            holder: newHolder.address,
            id: 0n,
            promissoryAmount: promissoryAmount,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: false
        }

        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    })

    it('pay promissory', async () => {
        console.log("Promissory master balance: ", await promissoryMaster.getMasterBalance())
        blockchain.now = 1707013425

        console.log(
            "Master: ", promissoryMaster.address,
            "Proissory: ", promissory.address,
            "Drawer: ", drawer.address
        )
        let payTx = await promissory.send(drawer.getSender(), {
            value: toNano("0.3")
        }, "pay")

        console.log(payTx.events)
        // console.log(await promissory.getPromissoryBalance())

        let promissoryInfo = await promissory.getPromissoryInfo()
        console.log(promissoryInfo)
        let validPromissoryInfo = {
            '$$type': 'PromissoryInfo',
            drawer: drawer.address,
            holder: newHolder.address,
            id: 0n,
            promissoryAmount: promissoryAmount,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: true
        }

        console.log("Promissory master balance: ", await promissoryMaster.getMasterBalance())

        // expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    })

    it('withdraw promissory', async () => {

    })

    it('withdraw promissory fee', async () => {

    })
});
