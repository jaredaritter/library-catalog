const mongoose = require('mongoose');
const moment = require('moment');

const Schema = mongoose.Schema;

const BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Available', 'Maintenance', 'Loaned', 'Reserved'],
    default: 'Maintenance',
  },
  due_back: { type: Date, default: Date.now },
});

// Virtual of bookinstance's URL
BookInstanceSchema.virtual('url').get(function () {
  return '/catalog/bookinstance/' + this._id;
});

// Virtue of bookinstance's due date
BookInstanceSchema.virtual('due_back_formatted').get(function () {
  return moment(this.due_back).format('MMMM Do, YYYY');
});

// Virtual for available boolean to play nice with handlebars
BookInstanceSchema.virtual('available').get(function () {
  return this.status === 'Available' ? true : false;
});

// Export model
module.exports = mongoose.model('BookInstance', BookInstanceSchema);
