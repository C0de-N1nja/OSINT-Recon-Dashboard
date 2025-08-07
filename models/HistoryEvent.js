const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const HistoryEventSchema = new Schema({
    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'ReconProfile',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    platform: {
        type: String,
        required: true
    },
    field: {
        type: String,
        required: true
    },
    oldValue: {
        type: String,
        default: ''
    },
    newValue: {
        type: String,
        default: ''
    }
});

module.exports = mongoose.model("HistoryEvent", HistoryEventSchema);    