import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from 'ton-core';
import { PromissoryMaster } from '../wrappers/PromissoryMaster';
import '@ton/test-utils';
import { Promissory } from '../wrappers/Promissory';

describe('NftCollection', () => {
    let blockchain: Blockchain;
    let promissoryMaster: SandboxContract<PromissoryMaster>;
    let deployer: SandboxContract<TreasuryContract>;
    let holder: SandboxContract<TreasuryContract>;
    let drawer: SandboxContract<TreasuryContract>;

    let promissoryAmount = 4321n
    let promissoryCommision = 2n
    let dateOfClose = 1707013424n

    const replacer = (key: any, value: any) =>
            typeof value === "bigint" ? value.toString() : value;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        promissoryMaster = blockchain.openContract(await PromissoryMaster.fromInit());
        deployer = await blockchain.treasury('deployer');
        holder = await blockchain.treasury('holder')
        drawer = await blockchain.treasury('drawer')

        const deployResult = await promissoryMaster.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and nftCollection are ready to use
    });

    it("create (mint) promissory", async () => {
        await promissoryMaster.send(drawer.getSender(), {
            value: toNano("0.3")
        }, {
            $$type: 'Mint',
            holder: holder.address,
            promissoryAmount: promissoryAmount,
            promissoryCommision: promissoryCommision,
            dateOfClose: dateOfClose
        })

        const promissory: SandboxContract<Promissory> = blockchain.openContract(Promissory.fromAddress(await promissoryMaster.getPromissoryAddressByIndex(0n)))
        
        let promissoryInfo = await promissory.getPromissoryInfo();
        let validPromissoryInfo = {
            '$$type': 'PromissoryInfo',
            drawer: drawer.address,
            holder: holder.address,
            id: 0n,
            promissoryAmount: promissoryAmount,
            promissoryCommision: promissoryCommision,
            dateOfClose: dateOfClose
        } 

        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    });

    it('promissory transfer', async () => {
        await promissoryMaster.send(drawer.getSender(), {
            value: toNano("0.3")
        }, {
            $$type: 'Mint',
            holder: holder.address,
            promissoryAmount: promissoryAmount,
            promissoryCommision: promissoryCommision,
            dateOfClose: dateOfClose
        })

        const promissory: SandboxContract<Promissory> = blockchain.openContract(Promissory.fromAddress(await promissoryMaster.getPromissoryAddressByIndex(0n)))
        const newHolder = await blockchain.treasury('newHolder')

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
            promissoryCommision: promissoryCommision,
            dateOfClose: dateOfClose
        }

        expect(JSON.stringify(promissoryInfo, replacer)).toEqual(JSON.stringify(validPromissoryInfo, replacer))
    })
});
