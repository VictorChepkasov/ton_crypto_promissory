import "@stdlib/deploy";
import "@stdlib/ownable";
import "./messages.tact";

contract Promissory with Deployable {

    holder: Address;
    drawer: Address;
    collectionAddress: Address;
    id: Int;
    promissoryAmount: Int;
    promissoryCommision: Int;
    dateOfClose: Int;
    deployed: Bool = false;

    init(
        collectionAddress: Address,
        id: Int
    ) {
        self.drawer = sender();
        self.holder = collectionAddress;
        self.collectionAddress = collectionAddress;
        self.id = id;
        self.promissoryAmount = 0;
        self.promissoryCommision = 0;
        self.dateOfClose = 0;
    }

    receive(msg: InternalNewPromissory) {
        self.drawer = msg.drawer;
        self.holder = msg.holder;
        self.promissoryAmount = msg.promissoryAmount;
        self.promissoryCommision = msg.promissoryCommision;
        self.dateOfClose = msg.dateOfClose;
        self.deployed = true;
    }

    receive(msg: Transfer){
        self.onlyHolder();
        self.holder = msg.newHolder;
    }

    get fun promissoryInfo(): PromissoryInfo {
        return PromissoryInfo{
            drawer: self.drawer,
            holder: self.holder,
            id: self.id,
            promissoryAmount: self.promissoryAmount,
            promissoryCommision: self.promissoryCommision,
            dateOfClose: self.dateOfClose
        };
    }

    fun onlyHolder() {
        require(sender() == self.holder, "Only Holder!");
    }
}