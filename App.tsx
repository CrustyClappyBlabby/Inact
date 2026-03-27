import React from "react";

const lars = {
  Name: "Lars",
  Age: 15,
  ShoeSize: 46,
  Gender: "M",
  Children: [],
  HøjdeData: {
    0: 50,
    1: 75,
    2: 82,
    3: 89,
    4: 95,
    5: 101,
    6: 107,
    7: 112.5,
    8: 118,
    9: 123.5,
    10: 129,
    11: 134.5,
    12: 140,
    13: 149.5,
    14: 159,
    15: 168.5,
  },
};
const iben = {
  Name: "Iben",
  Age: 26,
  ShoeSize: 38,
  Gender: "F",
  Children: [],
};
const bente = {
  Name: "Bente",
  Age: 46,
  ShoeSize: 37,
  Gender: "F",
  Children: [lars],
};
const viggo = {
  Name: "Viggo",
  Age: 47,
  ShoeSize: 42,
  Gender: "M",
  Children: [iben],
};
const henning = {
  Name: "Henning",
  Age: 65,
  ShoeSize: 44,
  Gender: "M",
  Children: [viggo, bente],
};

function App() {
  console.log(henning);
  /*
      During the solution of the tasks, please consider handling crappy data.
    */
  //lars.Children = [henning];

  return (
    <div className="App">
      <ol>
        <li>Write some code to show and navigate the family tree of Henning</li>
        <li>Visualize the ages of the family in a bar chart</li>
        <li>Calculate and show the average shoe size per gender</li>
        <li>
          Visualize the growth of Lars through the years. Make a <b>forecast</b>{" "}
          for his height at age 18.
        </li>
      </ol>
    </div>
  );
}

export default App;
