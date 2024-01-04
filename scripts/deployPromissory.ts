import { toNano } from '@ton/core';
import { Promissory } from '../wrappers/Promissory';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const promissory = provider.open(await Promissory.fromInit());

    await promissory.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(promissory.address);

    // run methods on `promissory`
}
