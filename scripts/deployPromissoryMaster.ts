import { toNano } from '@ton/core';
import { PromissoryMaster } from '../wrappers/PromissoryMaster';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const promissoryMaster = provider.open(await PromissoryMaster.fromInit());

    await promissoryMaster.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(promissoryMaster.address);

    // run methods on `promissoryMaster`
}
