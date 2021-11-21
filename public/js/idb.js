// create a variable to hold db connection
let db;
// establish a connection to indexedDB 
const request = indexedDB.open('budget_tracker', 1);

// this event will fire if there is a change in database
request.onupgradeneeded = function(e) {
    const db = e.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(e) {
    db = e.target.result;
    // check if app is online and upload transactions
    if (navigator.onLine) {
      uploadTransaction();
    }
  };
  
request.onerror = function(e) {
console.log(e.target.errorCode);
};


// save transaction to indexedDB when offline
function saveRecord(record) {
    // open a new transaction with the database and enable read and write permissions 
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    // access the object store 
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    // add transaction to your store with add method
    budgetObjectStore.add(record);
};

// function to handle collection of all the data 
function uploadTransaction() {
    // open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');
  
    const budgetObjectStore = transaction.objectStore('new_transaction');
  
    const getAll = budgetObjectStore.getAll();
  
    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function() {
    // if there is data in indexedDb's store, send it to the server
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
        .then(response => response.json())
        .then(serverResponse => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_transaction'], 'readwrite');
          // access the object store
          const budgetObjectStore = transaction.objectStore('new_transaction');
          // clear all items in your store
          budgetObjectStore.clear();

          alert('All pending transactions have been submitted!');
        })
        .catch(error => {
          console.log(error);
        });
    }
  }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);