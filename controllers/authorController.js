const Author = require('../models/author');

// DISPLAY LIST OF ALL AUTHORS
exports.author_list = (req, res) => {
  res.send('NOT IMPLEMENTED: Author list');
};

// DISPLAY DETAILS PAGE FOR SPECIFIC AUTHOR
exports.author_detail = (req, res) => {
  res.send('NOT IMPLEMENTED: Author detail ' + req.params.id);
};

// DISPLAY AUTHOR CREATE FORM ON GET
exports.author_create_get = (req, res) => {
  res.send('NOT IMPLEMENTED: Author create get');
};

// HANDLE AUTHOR CREATE ON POST
exports.author_create_post = (req, res) => {
  res.send('NOT IMPLEMENTED: Author create POST');
};

// DISPLAY AUTHOR DELETE FORM ON GET
exports.author_delete_get = (req, res) => {
  res.send('NOT IMPLEMENTED: Author delete GET');
};

// HANDLE AUTHOR DELETE ON POST
exports.author_delete_post = (req, res) => {
  res.send('NOT IMPLEMENTED: Author delet POST');
};

// DISPLAY AUTHOR UPDATE FORM ON GET
exports.author_update_get = (req, res) => {
  res.send('NOT IMPLEMENTED: Author update GET');
};

// HANDLE AUTHOR UPDATE ON POST
exports.author_update_post = (req, res) => {
  res.send('NOT IMPLEMENTED: Author update POST');
};
