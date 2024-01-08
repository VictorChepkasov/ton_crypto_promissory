import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages.tact";

contract Promissory with Deployable {

    const minTonForStorage: Int = ton("0.03");
    const gasConsumption: Int = ton("0.03");

    holder: Address;
    drawer: Address;
    collectionAddress: Address;
    id: Int;
    promissoryAmount: Int as coins;
    promissoryFee: Int;
    dateOfClose: Int;
    deployed: Bool;
    closed: Bool;

    init(
        collectionAddress: Address,
        id: Int
    ) {
        self.drawer = sender();
        self.holder = collectionAddress;
        self.collectionAddress = collectionAddress;
        self.id = id;
        self.promissoryAmount = 0;
        self.promissoryFee = 0;
        self.dateOfClose = 0;
        self.deployed = false;
        self.closed = false;
    }

    receive(msg: InternalNewPromissory) {
        require(sender() == self.collectionAddress, "Only Master");
        self.drawer = msg.drawer;
        self.holder = msg.holder;
        self.promissoryAmount = msg.promissoryAmount + (msg.promissoryAmount / 100 * msg.promissoryFee);
        self.promissoryFee = msg.promissoryFee;
        self.dateOfClose = msg.dateOfClose;
        self.deployed = true;
    }

    receive(msg: Transfer){
        self.onlyHolder();
        self.holder = msg.newHolder;
    }

    receive("pay") {
        require(sender() == self.drawer, "Only Drawer!");
        require(context().value >= self.promissoryAmount, "Insufficient funds!");
        require(now() >= self.dateOfClose, "It's not closing time yet!");
        let msgValue: Int = myBalance() - (self.minTonForStorage + self.gasConsumption);
        self.closed = true;
        send(SendParameters{
            to: self.collectionAddress,
            value: msgValue,
            mode: SendIgnoreErrors,
            body: "Promissory fee".asComment()
        });
    }

    receive("withdraw") {
        self.onlyHolder();
        require(self.closed == true, "Promissory is not closed!");
        send(SendParameters{
            to: sender(),
            value: myBalance() - context().value - (self.minTonForStorage + self.gasConsumption),
            mode: SendIgnoreErrors
        });
    }

    get fun promissoryInfo(): PromissoryInfo {
        return PromissoryInfo{
            drawer: self.drawer,
            holder: self.holder,
            id: self.id,
            promissoryAmount: self.promissoryAmount,
            promissoryFee: self.promissoryFee,
            dateOfClose: self.dateOfClose,
            closed: self.closed
        };
    }

    fun onlyHolder() {
        require(sender() == self.holder, "Only Holder!");
    }

    get fun promissoryBalance(): Int {
        return myBalance();
    }
}