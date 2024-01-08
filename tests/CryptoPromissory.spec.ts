import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from 'ton-core';
import { PromissoryMaster } from '../wrappers/PromissoryMaster';
import '@ton/test-utils';
import { Promissory } from '../wrappers/Promissory';

describe('Crypto Promissory Tests', () => {
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
    let msgValue = toNano(promissoryAmount) + (toNano(promissoryAmount) / 100n * promissoryFee)

    const replacer = (key: any, value: any) =>
        typeof value === "bigint" ? value.toString() : value;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        promissoryMaster = blockchain.openContract(await PromissoryMaster.fromInit());
        deployer = await blockchain.treasury('deployer');
        holder = await blockchain.treasury('holder')
        drawer = await blockchain.treasury('drawer')
        newHolder = await blockchain.treasury('newHolder')

        // deploy
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

        // create promissory
        await promissoryMaster.send(drawer.getSender(), {
            value: toNano("0.3")
        }, {
            $$type: 'Mint',
            holder: holder.address,
            promissoryAmount: toNano(promissoryAmount),
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose
        })

        // create promissory instance
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
            promissoryAmount: toNano(promissoryAmount) + (toNano(promissoryAmount) / 100n * promissoryFee),
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: false
        } 

        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    });

    it('promissory transfer', async () => {
        // transfer from holder.address to newHolder.address
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
            promissoryAmount: msgValue,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: false
        }
        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    })

    it('pay promissory', async () => {
        console.log(`Master: ${promissoryMaster.address}\nProissory: ${promissory.address}\nDrawer: ${drawer.address}\nHolder: ${holder.address}\nNew Holder: ${newHolder.address}`)
        // create evironment
        let beforeMasterBalancee: bigint = await promissoryMaster.getMasterBalance()
        blockchain.now = 1707013425

        // action
        await promissory.send(drawer.getSender(), {
            value: msgValue
        }, "pay")
        
        let promissoryInfo = await promissory.getPromissoryInfo()
        let validPromissoryInfo = {
            '$$type': 'PromissoryInfo',
            drawer: drawer.address,
            holder: holder.address,
            id: 0n,
            promissoryAmount: msgValue,
            promissoryFee: promissoryFee,
            dateOfClose: dateOfClose,
            closed: true
        }
        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
        expect(await promissoryMaster.getMasterBalance()).toBeGreaterThan(beforeMasterBalancee)
    })

    it('withdraw promissory', async () => {
        // create environment
        let promissoryBeforeBalance: bigint = await promissory.getPromissoryBalance()
        blockchain.now = 1707013425
        await promissory.send(drawer.getSender(), {
            value: msgValue
        }, "pay")

        // action
        await promissory.send(holder.getSender(), {
            value: toNano("0.03")
        }, "withdraw")

        expect(await promissory.getPromissoryBalance()).toBeLessThan(promissoryBeforeBalance)
    })

    it('withdraw promissory fee', async () => {
        // create environment
        blockchain.now = 1707013425
        await promissory.send(drawer.getSender(), {
            value: msgValue
        }, "pay")
        let beforeMasterBalancee: bigint = await promissoryMaster.getMasterBalance()

        // action
        await promissoryMaster.send(deployer.getSender(), {
            value: toNano("0.03")
        }, "withdraw")

        expect(await promissoryMaster.getMasterBalance()).toBeLessThan(beforeMasterBalancee)
    })
});