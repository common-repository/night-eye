class NodeCache {
    constructor(key, value) {
        this.key = key;
        this.val = value;
        this.newer = null;
        this.older = null;
    }
}

export default class LRUCache {

    constructor(capacity) {
        this.capacity = capacity;
        this.length = 0;
        this.map = new Map();
        // save the head and tail so we can update it easily
        this.head = null;
        this.tail = null;
    }

    node (key,value) {
        return new NodeCache(key, value);
    }

    get (key){
        if(this.map.has(key)){
            this.updateKey(key);
            return this.map.get(key).val;
        }else{
            return -1;
        }
    }

    updateKey (key){
        var node = this.map.get(key);
        // break the chain and reconnect with newer and older
        if(node.newer){
            node.newer.older= node.older;
        }else{
            this.head = node.older;
        }

        if(node.older){
            node.older.newer = node.newer;
        }else{
            this.tail = node.newer;
        }

        // replace the node into head - newest
        node.older = this.head;
        node.newer = null;
        if(this.head){
            this.head.newer = node;
        }
        this.head = node;

        // if no items in the bucket, set the tail to node too.
        if(!this.tail){
            this.tail = node;
        }
    }

    set (key,value){
        var node = this.node(key,value);
        // update the value for exist entries
        if(this.map.has(key)){
            this.map.get(key).val = value;
            this.updateKey(key);
            return;
        }
        if(this.length >= this.capacity){
        // remove the least recently used item
            var dKey = this.tail.key;
            this.tail = this.tail.newer;
            if(this.tail){
                this.tail.older = null;
            }
            var dNodeCache = this.map.get(dKey);
            if (dNodeCache !== undefined) {
                this.length -= dNodeCache.val.length;
                this.map.delete(dKey);
            }
           
        //this.length --
        }

        // insert node into the head
        node.older = this.head;
        // if have head, we need re-connect node with other nodes older than head
        if(this.head){
            this.head.newer = node;
        }
        this.head = node;
        // if no tail which means first insert, set the tail to node too
        if(!this.tail){
            this.tail = node;
        }
        this.map.set(key, node);
        this.length += node.val.length;
    }

}
