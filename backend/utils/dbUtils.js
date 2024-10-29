// utils/dbUtils.js

export const fetchRecords = (collectionName) => {
    return async (req, res) => {
      try {
        // Fetch all records from the collection as-is
        const records = await req.db.collection(collectionName).find().toArray();
  
        // Return only the array of records
        res.status(200).json(records);
      } catch (err) {
        res.status(500).json({
          status: 'error',
          message: err.message
        });
      }
    };
  };
  