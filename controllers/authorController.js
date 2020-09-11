const Author = require('../models/author');
const Book = require('../models/book');
const async = require('async');
const { body, validationResult } = require('express-validator');
const book = require('../models/book');
const e = require('express');

// DISPLAY LIST OF ALL AUTHORS
exports.author_list = (req, res) => {
  Author.find()
    .populate('author')
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) {
        return next(err);
      }
      res.render('author_list', {
        title: 'Author List',
        author_list: list_authors,
      });
    });
};

// DISPLAY DETAILS PAGE FOR SPECIFIC AUTHOR
exports.author_detail = (req, res, next) => {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      author_books: function (callback) {
        Book.find({ author: req.params.id }, 'title summary').exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results == null) {
        const err = new Error('Author not found');
        err.status = 404;
        return next(err);
      }
      res.render('author_detail', {
        title: 'Author Detail',
        author: results.author,
        author_books: results.author_books,
      });
      // res.json({ results });
    }
  );
};

// DISPLAY AUTHOR CREATE FORM ON GET
exports.author_create_get = (req, res, next) => {
  res.render('author_form', { title: 'Create Author' });
};

// HANDLE AUTHOR CREATE ON POST
exports.author_create_post = [
  // Validate and sanitize
  body('first_name')
    .isLength({ min: 1 })
    .trim()
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.')
    .escape(),
  body('family_name')
    .isLength({ min: 1 })
    .trim()
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.')
    .escape(),
  body('date_of_birth', 'Invalid date of birth')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Create Author',
        author: req.body,
        errors: errors.array(),
      });
      return;
    } else {
      const author = new Author({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,
      });
      author.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(author.url);
      });
    }
  },
];

// DISPLAY AUTHOR DELETE FORM ON GET
exports.author_delete_get = (req, res, next) => {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.params.id).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.author == null) {
        res.redirect('/catalog/authors');
      }
      res.render('author_delete', {
        title: 'Delete Author',
        author: results.author,
        author_books: results.authors_books,
      });
    }
  );
};

// HANDLE AUTHOR DELETE ON POST
exports.author_delete_post = (req, res, next) => {
  async.parallel(
    {
      author: function (callback) {
        Author.findById(req.body.authorid).exec(callback);
      },
      authors_books: function (callback) {
        Book.find({ author: req.body.authorid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.authors_books.length > 0) {
        res.render('author_delete', {
          title: 'Delete Author',
          author: results.author,
          author_books: results.authors_books,
        });
        return;
      } else {
        Author.findByIdAndDelete(req.body.authorid, function deleteAuthor(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/catalog/authors');
        });
      }
    }
  );
};

// DISPLAY AUTHOR UPDATE FORM ON GET
exports.author_update_get = (req, res, next) => {
  // Nothing to validate in GET
  // Only need single author info from DB. No other info needed for select bars or genre checkboxes
  Author.findById(req.params.id).exec(function (err, author) {
    if (err) return next(err);
    if (author == null) {
      const err = new Error('Author not found');
      err.status = 404;
      return next(err);
    }
    res.render('author_form', {
      title: 'Update Author',
      author: author,
    });
  });
};

// HANDLE AUTHOR UPDATE ON POST
exports.author_update_post = [
  // Not leading with handler function so has to be in array
  // Validate and sanitize information
  body('first_name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name must be specified.')
    .isAlphanumeric()
    .withMessage('First name has non-alphanumeric characters.')
    .escape(),
  body('family_name', 'Family name must not be empty')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Family name must be specified.')
    .isAlphanumeric()
    .withMessage('Family name has non-alphanumeric characters.')
    .escape(),
  body('date_of_birth', 'Invalid date of birth.')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body('date_of_death', 'Invalid date of death.')
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      res.render('author_form', {
        title: 'Update Author',
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      Author.findByIdAndUpdate(req.params.id, author, {}, function (
        err,
        theauthor
      ) {
        if (err) return next(err);
        res.redirect(theauthor.url);
      });
    }
  },
];
