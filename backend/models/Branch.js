// backend/models/Branch.js
const mongoose = require('mongoose');

const InfoSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  category: { type: String, required: true }
}, { timestamps: true });

// transforma _id → id e remove __v
InfoSchema.set('toJSON', {
  virtuals:    true,
  versionKey:  false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

const BranchSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  phone:          { type: String, required: true },
  city:           { type: String, required: true },
  state:          { type: String, required: true },
  address:        String,
  responsible:    { type: String, required: true },
  welcomeMessage: { type: String, default: '' },
  workingHours:   { type: String, default: '' },
  active:         { type: Boolean, default: true },
  infos:          [InfoSchema]
}, { timestamps: true });

// transforma _id → id e remove __v
BranchSchema.set('toJSON', {
  virtuals:    true,
  versionKey:  false,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
  }
});

module.exports = mongoose.model('Branch', BranchSchema);
