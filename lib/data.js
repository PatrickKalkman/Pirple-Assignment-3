/*
 * Functions for managing data, all data is stored in the 
 * .data folder.
 */

'use strict';

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

lib.createFilenameWithExtension = function(file) {
  return file + '.json';
};

lib.createFullPath= function (dir, file) {
  return lib.baseDir + dir + '/' + lib.createFilenameWithExtension(file);
};

// Create a new file with the given dir and filename and store the datai 
lib.create = function (dir, file, data, callback) {
  const fileName = lib.createFilenameWithExtension(file);
  const totalPath = lib.createFullPath(dir, file);
  // wx => create the file, but fail if it already exists
  fs.open(totalPath, 'wx', function (err, fileDescriptor) {
    if (!err) {
      // data is an object, we convert it to a JSON string before storing it
      const stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback(`create: An error occurred while trying to close the file "${fileName}" ${err}`);
            }
          });
        } else {
          callback(`create: An error occurred while trying to write to the file "${fileName}". ${err}`);
        }
      });
    } else {
      callback(`create: Could not create the file "${fileName}" it probably already exists. ${err}`);
    }
  });
};

// Delete the file with the given dir and filename
lib.delete = function (dir, file, callback) {
  const fileName = lib.createFilenameWithExtension(file);
  const totalPath = lib.createFullPath(dir, file);
  fs.unlink(totalPath, function (err) {
    if (!err) {
      // File deleted successfully
      callback(false);
    } else {
      callback(`delete: An error occurred while trying to delete the file ${fileName}. ${err}`);
    }
  });
};

// Update the file with the given data
lib.update = function (dir, file, data, callback) {
  const fileName = lib.createFilenameWithExtension(file);
  const totalPath = lib.createFullPath(dir, file);
  // w => open the file for writing, truncate the file if it exist
  fs.open(totalPath, 'w', function (err, fileDescriptor) {
    if (!err) {
      var stringData = JSON.stringify(data);
      fs.write(fileDescriptor, stringData, function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback(`update: An error occurred while trying to close the file ${fileName}. ${err}`);
            }
          });
        } else {
          callback(`update: An error occured while trying to write to ${fileName}. ${err}`);
        }
      });
    } else {
      callback(`update: An error occurred while trying to open the file ${fileName}. ${err}`);
    }
  });
};

// Read the given file as UTF-8 and convert it back to an object.
lib.read = function(dir, file, callback) {
  const fileName = lib.createFilenameWithExtension(file);
  const totalPath = lib.createFullPath(dir, file);
  fs.readFile(totalPath, 'UTF-8', function(err, data) {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(`read: Could not read file ${fileName}. ${err}`);
    }
  });
};

// List all the files in the given directory
lib.list = function(dir, callback) {
  fs.readdir(lib.baseDir + dir + '/', function(err, files) {
    if (!err && files && files.length > 0) {
      const filesWithoutExtensions = [];
      files.forEach(function(fileWithExtension) {
        filesWithoutExtensions.push(fileWithExtension.replace('.json', ''));
      });
      callback(false, filesWithoutExtensions);
    } else {
      if (!err) {
        callback(false, []);
      } else {
        callback(`list: Error while reading dir "${dir}". ${err}`);
      }
    }
  });
};

module.exports = lib;