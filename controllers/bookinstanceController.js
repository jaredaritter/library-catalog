var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
const { body, validationResult } = require('express-validator');
const async = require('async');
const moment = require('moment');

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) {
        return next(err);
      }
      res.render('bookinstance_list', {
        title: 'Book Instance List',
        bookinstance_list: list_bookinstances,
      });
    });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        const err = new Error('Book copy not found');
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', {
        title: 'Copy: ' + bookinstance.book.title,
        bookinstance: bookinstance,
      });
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
  Book.find({}, 'title').exec(function (err, books) {
    if (err) {
      return next(err);
    }
    res.render('bookinstance_form', {
      title: 'Create BookInstance',
      book_list: books,
    });
  });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  //Validate and sanitize
  body('book', 'Book must be specified').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('due_back', 'Invalid date')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('status', 'Status must be specified')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    // Error
    if (!errors.isEmpty()) {
      const returnedBookInstance = {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back_form_version: req.body.due_back
          ? moment(req.body.due_back).format('YYYY-MM-DD')
          : '',
      };
      Book.find({}, 'title').exec(function (err, books) {
        if (err) {
          return next(err);
        }
        res.render('bookinstance_form', {
          title: 'Create Book Instance',
          book_list: books,
          errors: errors.array(),
          bookinstance: returnedBookInstance,
        });
      });
      return;
    }
    // Valid
    else {
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back: req.body.due_back,
      });
      bookinstance.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(bookinstance.url);
      });
    }
  },
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
  BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) {
        return next(err);
      }
      if (bookinstance == null) {
        res.redirect('/catalog/bookinstances');
      }
      res.render('bookinstance_delete', {
        title: 'Delete Book Instance',
        bookinstance,
      });
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
  BookInstance.findByIdAndDelete(
    req.body.bookinstanceid,
    function deleteBookInstance(err) {
      if (err) {
        return next(err);
      }
      res.redirect('/catalog/bookinstances');
    }
  );
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
  async.parallel(
    {
      bookinstance: function (callback) {
        BookInstance.findById(req.params.id).exec(callback);
      },
      book_list: function (callback) {
        Book.find({}, 'title').exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstance == null) {
        const err = new Error('Book Instance not found');
        err.status = 404;
        return next(err);
        // Can probably also just redirect (could put error message on redirected page)
      }
      res.render('bookinstance_form', {
        title: 'Update Book Instance',
        bookinstance: results.bookinstance,
        book_list: results.book_list,
      });
    }
  );
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  // Validate and sanitize
  body('book', 'Book must not be empty').trim().isLength({ min: 1 }).escape(),
  body('imprint', 'Imprint must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('due_back', 'Date must be valid')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('status', 'Status must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const returnedBookInstance = {
        book: req.body.book,
        imprint: req.body.imprint,
        status: req.body.status,
        due_back_form_version: req.body.due_back
          ? moment(req.body.due_back).format('YYYY-MM-DD')
          : '',
      };
      Book.find({}, 'title').exec(function (err, book_list) {
        if (err) {
          return next(err);
        }
        res.render('bookinstance_form', {
          title: 'Update Book Instance',
          book_list: book_list,
          bookinstance: returnedBookInstance,
          errors: errors.array(),
        });
        return;
      });
    } else {
      const bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint,
        due_back: req.body.due_back,
        status: req.body.status,
        _id: req.params.id, // Required or a new ID will be assigned!
      });
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (
        err,
        thebookinstance
      ) {
        if (err) return next(err);
        res.redirect(thebookinstance.url);
      });
    }
  },
];
