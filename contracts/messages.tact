struct MasterData {
    nextPromissoryIndex: Int;
    masterContent: Cell;
    owner: Address;
}

struct PromissoryInfo {
    drawer: Address;
    holder: Address;
    id: Int;
    promissoryAmount: Int as coins;
    promissoryFee: Int;
    dateOfClose: Int;
    closed: Bool;
}

message Mint {
    holder: Address;
    promissoryAmount: Int as coins;
    promissoryFee: Int;
    dateOfClose: Int;
}

message Transfer {
    queryId: Int;
    newHolder: Address;
}

message InternalNewPromissory {
    drawer: Address;
    holder: Address;
    promissoryAmount: Int as coins;
    promissoryFee: Int;
    dateOfClose: Int;
}