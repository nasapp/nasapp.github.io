'use strict';

var User = function(jsonStr) {
    if (jsonStr) {
        var obj = JSON.parse(jsonStr);
        this.address = obj.address;    
        this.timestamp = obj.timestamp;
    } else {
        this.address = "";
        this.timestamp = 0;
    }
};

User.prototype = {
    toString: function() {
        return JSON.stringify(this);
    }
};

var TenyearsContract = function() {
    LocalContractStorage.defineProperty(this, "userNumber");   
    LocalContractStorage.defineMapProperty(this, "userPool", {  
        parse: function(jsonText) {
            return new User(jsonText);
        },
        stringify: function(obj) {
            return obj.toString();
        }
    });
};

TenyearsContract.prototype = {
    init: function() {
        this.userNumber = 0;
    },

    getuserNumber: function() {
        return this.userNumber;
    },

    withdraw: function() {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        if (value != 0) {
            throw new Error("Sorry, you can't pay any nas.");
        }
        if (this.isUserAddressExists(from)) {
            var user = this.userPool.get(from);
            var now = new Date().getTime();
            if ( (now - user.timestamp) < 200*1000 )
            {
                throw new Error("Sorry, you can't withdraw now.");
            }
            var result = Blockchain.transfer(user.address, 10 * 1000000000000000000);
            if (!result) {
                Event.Trigger("GetNasTransferFailed", {
                    Transfer: {
                        from: Blockchain.transaction.to,
                        to: user.address,
                        value: 10
                    }
                });
                throw new Error("GetNas transfer failed.");
            }
            this.userPool.del(from);
            this.userNumber = this.userNumber - 1;

        } else {
            throw new Error("Sorry, you can't withdraw.");
        }
    },

    deposit: function() {
        var from = Blockchain.transaction.from;
        var value = Blockchain.transaction.value;
        if (value != 10 * 1000000000000000000) {
            throw new Error("Sorry, please add 10 NAS only.");
        }
        if (this.isUserAddressExists(from)) {
            throw new Error("Sorry, you can't deposit twice.");
        } else {
            this.userNumber = this.userNumber+1;
            var user = new User();
            user.address = from;
            user.timestamp = new Date().getTime();
            this.userPool.put(from, user); 
        }
    },

    isUserAddressExists: function(address) {
        var user = this.userPool.get(address);
        if (!user) {
            return false;
        }
        return true;
    }

}

module.exports = TenyearsContract;