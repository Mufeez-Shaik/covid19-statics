const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const port = 8080;
const {Schema} =require("mongoose")
const {data} = require("./data")

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
const mongoURI =
" mongodb+srv://Mufeez:mufeezS1212@@cluster0.g19xzil.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("connection established ");
  })
  .catch((err) => {
    console.log("error while connecting", err);
  });
const tallySchema = new Schema({
  state: Schema.Types.String,
  infected: Schema.Types.Number,
  recovered: Schema.Types.Number,
  death: Schema.Types.Number,
  
});
  const covid19Statics = mongoose.model("covid19Statics", tallySchema);
  covid19Statics.insertMany(data)
  .then(() => console.log('Documents added'))
  .catch(error => console.error('Error:', error));
  

  app.get('/totalRecovered', async (req, res) => {
    const totalRecovered = data
    .map((recover)=>recover.recovered)
    .reduce((acc,count)=>acc+count,0)
    const response = { data: { _id: "total", totalRecovered: totalRecovered } };
    res.status(200).send(response);
  });


  app.get("/totalActive", (req, res) => {
    const totalActive = data
      .map((active) => active.infected)
      .reduce((acc, count) => acc + count, 0);
    console.log(`Total number of infected patients: ${totalActive}`);
  
    const response = { data: { _id: "total", activeCases: totalActive } };
    res.status(200).send(response);
  });
  app.get("/totalDeath", (req, res) => {
    const totalDeath = data
      .map((active) => active.death)
      .reduce((acc, count) => acc + count, 0);
    console.log(`Total number of death patients: ${totalDeath}`);
  
    const response = { data: { _id: "total", totalDeath: totalDeath } };
    res.status(200).send(response);
  });
  
  app.get('/hotspotStates', async (req, res) => {
    const result = await covid19Statics.aggregate([
      { $addFields: { rate: { $round: [{ $divide: [{ $subtract: ['$infected', '$recovered'] }, '$infected'] }, 5] } } },
      { $match: { rate: { $gt: 0.1 } } },
      { $project: { _id: 0, state: 1, rate: 1 } }
    ]);
    res.json({ data: result });
  });
  app.get('/healthyStates', async (req, res) => {
    const result = await covid19Statics.aggregate([
      { $addFields: { mortality: { $round: [{ $divide: ['$death', '$infected'] }, 5] } } },
      { $match: { mortality: { $lt: 0.005 } } },
      { $project: { _id: 0, state: 1, mortality: 1 } }
    ]);
    res.json({ data: result });
  });
  

app.listen(port, () => console.log(`App is on the port ${port}!`));

module.exports = app;