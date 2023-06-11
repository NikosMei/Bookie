const elasticConnect = require("./elasticConnect");
const client = elasticConnect.client;

//Index a book in Elasticsearch
const indexBook = async (id, title, author, category, summary, size) => {
  try {
    const response = await client.index({
      index: "books",
      id: id,
      body: {
        title: title,
        author: author,
        category: category,
        summary: summary,
        size: size,
      },
    });

    return response;
  } catch (error) {
    console.error("Error indexing book:", error);
    throw error;
  }
};

//Index a user in Elasticsearch
async function indexUser(userId, subscription, nickname) {
  try {
    const startingDate = new Date().toISOString(); // Current date as starting date
    const endingDate = new Date();
    endingDate.setMonth(endingDate.getMonth() + 1); // Add 1 month to the starting date
    const bookReading = 2;

    const body = await client.index({
      index: "users",
      id: userId, // Use userId as the _id
      body: {
        id: userId,
        subscription: subscription,
        nickname: nickname,
        startingDate: startingDate,
        endingDate: endingDate.toISOString(),
        bookReading: bookReading,
      },
    });

    console.log("User indexed:", body);
    return body;
  } catch (error) {
    console.error("Error indexing user:", error);
    return null;
  }
}

// Retrieve a user from Elasticsearch
async function getUser(userId) {
  try {
    const body = await client.get({
      index: "users",
      id: userId,
    });

    const user = body._source;
    console.log("User:", user);
    return user;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

/// Check if a user exists in Elasticsearch
async function checkUserExists(userId) {
  try {
    const body = await client.exists({
      index: "users",
      id: userId,
    });

    const userExists = body;
    console.log(`User ${userId} exists: ${userExists}`);
    if (userExists == undefined) {
      return false;
    }
    return userExists;
  } catch (error) {
    if (error.statusCode === 404) {
      console.log(`User ${userId} does not exist`);
      return false;
    }
    console.error("Error checking user existence:", error);
    return false;
  }
}

// Retrieve the bookReading field of a user from Elasticsearch
async function getBookReading(userId) {
  try {
    const body = await client.get({
      index: "users",
      id: userId,
    });

    const user = body._source;
    const bookReading = user.bookReading;
    console.log(`User ${userId} - Book Reading: ${bookReading}`);
    return bookReading;
  } catch (error) {
    console.error("Error getting user bookReading:", error);
    return null;
  }
}

// Update the bookReading field of a user in Elasticsearch
async function updateBookReading(userId, newBookReading) {
  try {
    const body = await client.update({
      index: "users",
      id: userId,
      body: {
        doc: {
          bookReading: newBookReading,
        },
      },
    });

    console.log("User bookReading updated:", body);
    return body;
  } catch (error) {
    console.error("Error updating user bookReading:", error);
    return null;
  }
}

// Decrease the bookReading field of a user in Elasticsearch by 1
async function decreaseBookReading(userId) {
  try {
    const user = await getUser(userId);
    const currentBookReading = user.bookReading;

    if (currentBookReading > 0) {
      const newBookReading = currentBookReading - 1;
      await updateBookReading(userId, newBookReading);
      console.log(
        `User ${userId} - Book Reading decreased to ${newBookReading}`
      );
      return true;
    } else {
      console.log(`User ${userId} - Book Reading is already 0 or negative`);
      return false;
    }
  } catch (error) {
    console.error("Error decreasing user bookReading:", error);
    return false;
  }
}

// Search for book recommendations using MLT query with multiple book IDs
async function getBookRecommendationsMLT(readingList) {
  try {
    const bookIds = readingList.map((reading) => reading._id);
    const body = await client.search({
      index: "books",
      body: {
        query: {
          more_like_this: {
            fields: ["title", "author", "category", "summary"],
            like: readingList.map((reading) => ({
              _index: "books",
              _id: reading._id,
            })),
            min_term_freq: 1,
            max_query_terms: 12,
          },
        },
        size: 10,
      },
    });

    const recommendations = body.hits.hits;
    //console.log("Book recommendations:", recommendations);
    return recommendations;
  } catch (error) {
    console.error("Error getting book recommendations:", error);
    return [];
  }
}

// Retrieve all books from each category
async function getAllBooksByCategory() {
  try {
    const body = await client.search({
      index: "books",
      body: {
        aggs: {
          categories: {
            terms: {
              field: "category.keyword",
              size: 30, // Number of categories to retrieve
            },
            aggs: {
              books: {
                top_hits: {
                  size: 100, // Number of books per category to retrieve
                },
              },
            },
          },
        },
        size: 0,
      },
    });

    const categories = body.aggregations.categories.buckets.map((bucket) => {
      const category = bucket.key;
      const books = bucket.books.hits.hits;
      return { category, books };
    });

    //console.log("Books by category:", categories);
    return categories;
  } catch (error) {
    console.error("Error getting books by category:", error);
    return [];
  }
}

// Retrieve every book from Elasticsearch
async function getAllBooks() {
  try {
    const body = await client.search({
      index: "books",
      query: {
        match_all: {}, // Match all documents
      },
      size: 10000, // Adjust the size based on the number of books in the index
    });
    const books = body.hits.hits;
    //console.log("All books:", books);
    return books;
  } catch (error) {
    console.error("Error getting all books:", error);
    return [];
  }
}

// Perform full-text search for books
async function searchBooks(query) {
  try {
    const body = await client.search({
      index: "books",
      body: {
        query: {
          multi_match: {
            query,
            fields: ["title", "author", "category", "summary"],
          },
        },
        size: 100, // Number of search results to retrieve
      },
    });

    const searchResults = body.hits.hits;
    //console.log("Search results:", searchResults);
    return searchResults;
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

async function checkUserAndBookReading(userId, bookId) {
  try {
    const exists = await checkUserExists(userId);

    if (!exists) {
      const userIndexResult = await indexUser(
        userId,
        false,
        getLeftSideOfString(userId)
      );
      console.log("User indexed:", userIndexResult);

      // Call addReading with the same userId and an empty array
      const addReadingResult = await addReading([], userId);
      console.log("Reading added:", addReadingResult);
      return true;
    } else {
      const user = await getUser(userId);
      console.log("User:", user);

      if (user.subscription) {
        return true;
      }

      const bookReading = await getBookReading(userId);
      console.log(`Book reading for user ${userId}:`, bookReading);

      if (bookReading > 0) {
        return true;
      }

      const isBookInReading = await checkBookIdInReading(userId, bookId);
      return isBookInReading;
    }
  } catch (error) {
    console.error("Error checking user and book reading:", error);
    return false;
  }
}

// Add a new reading entry to Elasticsearch with an array of book ids
async function addReading(bookIds, userId) {
  try {
    const { body } = await client.index({
      index: "reading",
      id: userId,
      body: {
        book_ids: bookIds,
        user_id: userId,
      },
    });

    console.log("Reading entry added:", body);
    return body;
  } catch (error) {
    console.error("Error adding reading entry:", error);
    return null;
  }
}

// Add a bookId to the array of book_ids in the reading entry
async function addBookToReading(bookId, userId) {
  try {
    const { body } = await client.update({
      index: "reading",
      id: userId,
      body: {
        script: {
          source:
            "if (!ctx._source.book_ids.contains(params.bookId)) { ctx._source.book_ids.add(params.bookId) }",
          lang: "painless",
          params: {
            bookId: bookId,
          },
        },
      },
    });

    console.log(`Book ${bookId} added to user ${userId}'s reading list`);
    return body;
  } catch (error) {
    console.error("Error adding book to reading:", error);
    return null;
  }
}

//Check if a book is being read by a user
async function checkBookIdInReading(userId, bookId) {
  try {
    const body = await client.search({
      index: "reading",
      body: {
        query: {
          bool: {
            must: [
              { match: { user_id: userId } },
              { terms: { book_ids: [bookId] } },
            ],
          },
        },
      },
    });

    const exists = body.hits.total.value > 0;
    console.log(`Book ${bookId} exists in reading for user ${userId}:`, exists);

    return exists;
  } catch (error) {
    console.error("Error checking book ID in reading:", error);
    return false;
  }
}

// Check if current date is between starting and ending dates, and update if necessary
async function checkAndUpdateUserDates(userId) {
  try {
    const user = await getUser(userId);
    const currentDate = new Date();
    const startingDate = new Date(user.startingDate);
    const endingDate = new Date(user.endingDate);

    if (currentDate > endingDate) {
      const newStartingDate = endingDate;
      const newEndingDate = new Date(newStartingDate);
      newEndingDate.setDate(newEndingDate.getDate() + 30);

      await updateUserData(userId, {
        startingDate: newStartingDate,
        endingDate: newEndingDate,
        bookReading: 2,
      });

      console.log(`User ${userId} - Dates updated`);
      return true;
    } else {
      console.log(`User ${userId} - Dates are up to date`);
      return false;
    }
  } catch (error) {
    console.error("Error checking and updating user dates:", error);
    return false;
  }
}

//Updates the user's subscription from free to premium
async function updateUserSubscription(userId) {
  try {
    const body = {
      doc: {
        subscription: true,
      },
    };

    const result = await client.update({
      index: "users",
      id: userId,
      body: body,
    });

    console.log(`User ${userId} subscription updated.`);
    return result;
  } catch (error) {
    console.error("Error updating user subscription:", error);
    throw error;
  }
}

//Retrive the books that a certain user is reading or has read
async function getUserReadingBooks(userId) {
  try {
    const body = await client.get({
      index: "reading",
      id: userId,
    });

    const readingBooks = body._source.book_ids;

    const booksBody = await client.search({
      index: "books",
      body: {
        query: {
          terms: {
            _id: readingBooks,
          },
        },
      },
    });

    const books = booksBody.hits.hits;

    return books;
  } catch (error) {
    console.error("Error retrieving user reading books:", error);
    return [];
  }
}

//Count all the books that are in store in Elasticsearch
const countBooks = async () => {
  try {
    const response = await client.count({
      index: "books",
    });

    return response.count;
  } catch (error) {
    console.error("Error counting books:", error);
    throw error;
  }
};

//Index a review-comment for a certain book
async function indexReview(bookId, userId, comment) {
  try {
    const body = await client.update({
      index: "reviews",
      id: bookId, // Use bookId as the _id
      body: {
        script: {
          source:
            "if (ctx._source.comments == null) { ctx._source.comments = [] } ctx._source.comments.add(params.comment)",
          lang: "painless",
          params: {
            comment: { userId: userId, comment: comment },
          },
        },
        upsert: {
          comments: [{ userId: userId, comment: comment }],
        },
      },
    });

    console.log("Review indexed:", body);
    return body;
  } catch (error) {
    console.error("Error indexing review:", error);
    return null;
  }
}

//Retrieve all the reviews-comments of a certain book
async function getBookReviews(bookId) {
  try {
    const body = await client.get({
      index: "reviews",
      id: bookId,
    });

    const reviews = body._source?.comments || [];
    //console.log("Book reviews:", reviews);
    return reviews;
  } catch (error) {
    console.error("Error retrieving book reviews:", error);
    return [];
  }
}

//User to get the left side of a string that has the @
function getLeftSideOfString(str) {
  const atIndex = str.indexOf("@");
  if (atIndex !== -1) {
    return str.substring(0, atIndex);
  }
  return "";
}

module.exports = {
  getAllBooks,
  getAllBooksByCategory,
  getBookRecommendationsMLT,
  searchBooks,
  indexBook,
  indexUser,
  checkUserExists,
  getBookReading,
  updateBookReading,
  getUser,
  checkUserAndBookReading,
  decreaseBookReading,
  addReading,
  addBookToReading,
  getUserReadingBooks,
  updateUserSubscription,
  countBooks,
  getBookReviews,
  indexReview,
};
