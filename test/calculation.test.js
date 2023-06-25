const axios = require('axios');


describe('collectData endpoint', () => {
    beforeAll(() => {
        uniqueIDs = generateUniqueIDs(100); // Generate 100 random unique IDs
    
      });
    
      afterAll(async() => {
        await sleep(5);
        const response = await axios.post('http://localhost:8081/collectData', {
              lift: lifts[0].name,
              uniqueID: 2
            });
            
        for (const lift of lifts) {
            expect(response.data[lift.name]).toBe(lift.expectedQueue);
        }
        
      },8000);
    
  const lifts = [
    {name: "silverFir", expectedQueue: 100},
    {name: "reggies", expectedQueue: 100},
    {name: "centralExpress", expectedQueue: 100},
    {name: "triple60", expectedQueue: 100},
    {name: "gallery", expectedQueue: 100},
    {name: "holiday", expectedQueue: 100},
    {name: "easyStreet", expectedQueue: 100}]; 
  let uniqueIDs;


  test.each(lifts)('should collect data for lift %s', async (lift) => {
    for (const uniqueID of uniqueIDs) {
      try {
        const response = await axios.post('http://localhost:8081/collectData', {
          lift: lift.name,
          uniqueID: uniqueID
        });
  
        console.log(`Response for ${lift.name}:${uniqueID}:`, response.data);
        expect(response.status).toBe(200);
        // Add more assertions as needed
      } catch (error) {
        console.error(`Error for ${lift.name}:${uniqueID}:`, error);
        throw error;
      }
    }
  });
},8000);



// Helper function to generate an array of random unique IDs
function generateUniqueIDs(count) {
  const uniqueIDs = [];
  
  for (let i = 0; i < count; i++) {
    const uniqueID = Math.random().toString(36).substring(7);
    uniqueIDs.push(uniqueID);
  }
  
  return uniqueIDs;
}
async function sleep(seconds) {
    return new Promise((resolve) =>setTimeout(resolve, seconds * 1000));
    }