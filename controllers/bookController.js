var Book = require('../models/book');
var Author = require('../models/author');
var Genre = require('../models/genre');
var BookInstance = require('../models/bookinstance');
const async = require('async');
const { body, validationResult } = require('express-validator');

exports.index = function (req, res) {
  async.parallel(
    {
      book_count: function (callback) {
        Book.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      book_instance_count: function (callback) {
        BookInstance.countDocuments({}, callback);
      },
      book_instance_available_count: function (callback) {
        BookInstance.countDocuments({ status: 'Available' }, callback);
      },
      author_count: function (callback) {
        Author.countDocuments({}, callback);
      },
      genre_count: function (callback) {
        Genre.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render('index', {
        title: 'Local Library Home',
        error: err,
        data: results,
      });
      console.table(results);
    }
  );
};

// Display list of all books.
exports.book_list = function (req, res, next) {
  Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, list_books) {
      if (err) {
        return next(err);
      }
      res.render('book_list', { title: 'Book list', book_list: list_books });
    });
};

// Display detail page for a specific book.
exports.book_detail = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id)
          .populate('author')
          .populate('genre')
          .exec(callback);
      },
      book_instance: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      res.render('book_detail', {
        title: results.book.title,
        book: results.book,
        book_instance: results.book_instance,
      });
    }
  );
};

// Display book create form on GET.
exports.book_create_get = function (req, res, next) {
  async.parallel(
    {
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render('book_form', {
        title: 'Create Book',
        authors: results.authors,
        genres: results.genres,
      });
    }
  );
};

// Handle book create on POST.
exports.book_create_post = [
  // Convert genre to array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  // Validate and sanitize fields
  body('title', 'Title must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('author', 'Author must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty.').trim().isLength({ min: 1 }).escape(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    // Create book object
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, results) {
          console.log(req.body);
          if (err) {
            return next(err);
          }
          for (let i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id) > -1) {
              results.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Create Book',
            authors: results.authors,
            genres: results.genres,
            book: req.body,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      book.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(book.url);
      });
    }
  },
];

// Display book delete form on GET.
exports.book_delete_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id).exec(callback);
      },
      bookinstances: function (callback) {
        BookInstance.find({ book: req.params.id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        res.redirect('/catalog/books');
      }
      res.render('book_delete', {
        title: 'Book Delete',
        book: results.book,
        bookinstances: results.bookinstances,
      });
    }
  );
};

// Handle book delete on POST.
exports.book_delete_post = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.body.bookid).exec(callback);
      },
      bookinstances: function (callback) {
        BookInstance.find({ book: req.body.bookid }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.bookinstances.length > 0) {
        res.render('book_delete', {
          title: 'Book Delete',
          book: results.book,
          bookinstances: results.bookinstances,
        });
        return;
      } else {
        Book.findByIdAndDelete(req.body.bookid, function deleteBook(err) {
          if (err) {
            return next(err);
          }
          res.redirect('/catalog/books');
        });
      }
    }
  );
};

// Display book update form on GET.
exports.book_update_get = function (req, res, next) {
  async.parallel(
    {
      book: function (callback) {
        Book.findById(req.params.id).populate('author').exec(callback);
      },
      authors: function (callback) {
        Author.find(callback);
      },
      genres: function (callback) {
        Genre.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.book == null) {
        const err = new Error('Book not found');
        err.status = 404;
        return next(err);
      }
      // Check logic for checks, currently filling them all in.
      for (let i = 0; i < results.genres.length; i++) {
        for (let j = 0; j < results.book.genre.length; j++) {
          if (
            results.genres[i]._id.toString() ===
            results.book.genre[j]._id.toString()
          ) {
            results.genres[i].checked = 'true';
          }
        }
      }
      res.render('book_form', {
        title: 'Update Book',
        authors: results.authors,
        genres: results.genres,
        book: results.book,
      });
    }
  );
};

// Handle book update on POST.
exports.book_update_post = [
  // Convert genre to array
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },
  // Validate and sanitize
  body('title', 'Title must not be empty').trim().isLength({ min: 1 }).escape(),
  body('author', 'Author must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('summary', 'Summary must not be empty')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({ min: 1 }).escape(),
  body('genre.*').escape(),
  // Process request
  (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id, // Required or a new ID will be assigned!
    });
    if (!errors.isEmpty()) {
      async.parallel(
        {
          authors: function (callback) {
            Author.find(callback);
          },
          genres: function (callback) {
            Genre.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }
          for (const i = 0; i < results.genres.length; i++) {
            if (book.genre.indexOf(results.genres[i]._id > -1)) {
              results.genres[i].checked = 'true';
            }
          }
          res.render('book_form', {
            title: 'Update Book',
            authors: results.authors,
            genres: results.genres,
            book: book,
            errors: errors.array(),
          });
          return;
        }
      );
    } else {
      Book.findByIdAndUpdate(req.params.id, book, {}, function (err, thebook) {
        if (err) {
          return next(err);
        }
        res.redirect(thebook.url);
      });
    }
  },
];
