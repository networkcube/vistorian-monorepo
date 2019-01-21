
export = swiftSet;
export as namespace swiftSet;

declare namespace swiftSet {

    interface Set {
        mutable(): Set;
        toString(): string;
        wrapObj(getId: (v: any)=>number): (v: any)=>number;
        isWrapped: (v: any)=>boolean;
        unwrap(): any[];
        add(a: any[]): Set;
        addItems(...args: any[]): Set;
        remove(a: any[]): Set;
        removeItems(...args: any[]): Set;
        size(): number;
        has(value: any): boolean;
        items(): any[];
        each(item: (v: any)=>void): void;
        copy(): Set;
        clear(newvalues: any[]): Set;
        union(other: Set): Set;
        union(other: any[]): Set;
        intersection(other: Set): Set;
        intersection(other: any[]): Set;
        difference(other: Set): Set;
        difference(other: any[]): Set;
        complement(other: Set): Set;
        complement(other: any[]): Set;
        equals(other: Set): boolean;
        equals(other: any[]): boolean;        
    }

    function Set(a: any[], key?: any): Set;
    function pushUid(fn: ()=>number): void;
    function popUid(): void;
    function union(a: any[], b: any[]): any[];
    function intersection(a: any[], b: any[]): any[];
    function difference(a: any[], b: any[]): any[];
    function complement(a: any[], b: any[]): any[];
}

