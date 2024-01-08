import "@stdlib/deploy";
import "@stdlib/ownable";
import "./promissory.tact";

contract PromissoryMaster with Deployable, Ownable {
    
    const minTonForStorage: Int = ton("0.03");
    const gasConsumption: Int = ton("0.03");

    owner: Address;
    nextPromissoryIndex: Int as uint32 = 0;
    masterContent: String;

    init() {
        self.owner = sender();
        self.masterContent = "Crypto Promissory Master";    
    }

    receive("Promissory fee") {
        dump("funds received");
    }

    receive(msg: Mint){
        require(self.nextPromissoryIndex >= 0, "non-sequential NFTs");
        let init: StateInit = self.promissoryInit(self.nextPromissoryIndex);
        let msgValue: Int = context().value;
        let tonBalanceBeforeMsg: Int = myBalance() - msgValue;
        let storageFee: Int = self.minTonForStorage - min(tonBalanceBeforeMsg, self.minTonForStorage);
        msgValue = msgValue - (storageFee + self.gasConsumption);

        send(SendParameters{
            to: contractAddress(init),
            value: msgValue,
            mode: SendIgnoreErrors,
            bounce: false,
            body: InternalNewPromissory{
                holder: msg.holder,
                drawer: sender(),
                promissoryAmount: msg.promissoryAmount,
                promissoryFee: msg.promissoryFee,
                dateOfClose: msg.dateOfClose
            }.toCell(),
            code: init.code,
            data: init.data
        });

        self.nextPromissoryIndex = self.nextPromissoryIndex + 1;
    }

    receive("withdraw") {
        require(sender() == self.owner, "Only Owner!");
        send(SendParameters{
            to: sender(),
            value: myBalance() - context().value - (self.minTonForStorage + self.gasConsumption),
            mode: SendIgnoreErrors
        });
    }

    get fun promissoryInit(promissoryIndex: Int): StateInit {
        return initOf Promissory(myAddress(), promissoryIndex);
    }

    get fun promissoryAddressByIndex(promissoryIndex: Int): Address {
        return contractAddress(self.promissoryInit(promissoryIndex));
    }

    get fun masterData(): MasterData {
        return MasterData{
            nextPromissoryIndex: self.nextPromissoryIndex,
            masterContent: self.masterContent.asSlice().asCell(),
            owner: self.owner
        };
    }

    get fun masterBalance(): Int {
        return myBalance();
    }
}