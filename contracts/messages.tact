struct MasterData {
    nextPromissoryIndex: Int;
    masterContent: Cell;
    owner: Address;
}

struct PromissoryInfo {
    drawer: Address;
    holder: Address;
    id: Int;
    promissoryAmount: Int;
    promissoryCommision: Int;
    dateOfClose: Int;
}

message Mint {
    holder: Address;
    promissoryAmount: Int;
    promissoryCommision: Int;
    dateOfClose: Int;
}

message Transfer {
    queryId: Int;
    newHolder: Address;
}

message InternalNewPromissory {
    drawer: Address;
    holder: Address;
    promissoryAmount: Int;
    promissoryCommision: Int;
    dateOfClose: Int;
}