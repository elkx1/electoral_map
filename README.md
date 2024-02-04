# UK Electoral Map

Welcome to the UK Electoral Map project! This web page provides an interactive and visually engaging way to explore electoral data in the United Kingdom. The visualisation allows users to scroll back through the years and track electoral trends over time and easily compare results in different constituencies.

Visit the live visualization [here](https://elkx1.github.io/electoral_map/).

## Table of Contents
1. [Introduction](#introduction)
2. [Data Sources](#data-sources)
3. [Stack](#stack)
3. [How to Use](#how-to-use)
4. [Future Enhancements](#future-enhancements)
5. [Contributing](#contributing)
6. [Acknowledgements](#acknowledgements)

## Introduction
This project aims to present electoral data in the UK in an intuitive and interactive way. Users can explore constituencies, parties, and electoral results over different years, gaining insights into the changing political landscape.

## Data Sources
The visualization is powered by data from various sources:
- TopoGEO shapes: [UK-GeoJSON](https://martinjc.github.io/UK-GeoJSON/)
- Electoral results: [Electoral Calculus](https://www.electoralcalculus.co.uk/flatfile.html)
- UK Data Service: [UK Data Service](https://borders.ukdataservice.ac.uk/easy_download.html)

Additionally, in future, mapping of constituencies to wards for old election data can be achieved using documents such as "The Parliamentary Constituencies (England) Order 2007" ([link](https://www.legislation.gov.uk/uksi/2007/1681/schedule/made)). However, this work has not been done yet, so scrollback is limited to 2005. Contributions are welcome!

## Stack
The project utilizes a robust tech stack to ensure efficient development, testing, and deployment. Here's an overview of the key components:

### [Node Package Manager (npm)](https://www.npmjs.com/)

The project is managed as a Node.js package and relies on npm for package management. npm is used to install, manage, and run various dependencies and scripts.

### [Jest](https://jestjs.io/)

[Jest](https://jestjs.io/) is the chosen testing framework for the project. The `npm test` command triggers Jest to run the test suite.

### [Webpack](https://webpack.js.org/)

[Webpack](https://webpack.js.org/) is employed for bundling and building the project into a deployable package. The `npm run build` command initiates the build process, optimizing the project for production.

### [GitHub Actions](https://github.com/features/actions)

[GitHub Actions](https://github.com/features/actions) is used for continuous integration (CI) in this project. Test, build, and deployment happens automatically on merge to the main branch.

### [d3](https://d3js.org/)

[d3](https://d3js.org/) is a powerful JavaScript library for data visualization. It is used to draw the map and graphs.

### [TopoJSON](https://github.com/topojson/topojson)

[TopoJSON](https://github.com/topojson/topojson) is a library for processing TopoJSON data. It is employed to efficiently handle geographic data, enabling the project to display constituency shapes and boundaries.

### Supported npm Commands:

- **`npm test`**: Executes Jest tests to ensure code reliability.
- **`npm run build`**: Initiates the Webpack build process, creating a deployable package for production.
- **`npm start`**: Launches a local web server using Webpack, providing a convenient environment for development and testing.

## How to Use
To use the web page, simply move the mouse across the map. Click on a region of interest to view details. At the bottom you can scroll through the years.

## Future Enhancements
The project is open to future enhancements and feature additions. Some potential ideas include:

Filter data by party.

- Include additional years (needs constituencies map data).
- Incorporate predicted results by Electoral Calculus.
- View more constituency details.
- Search for constituencies.
- Show/hide parties and county boundaries.
- Multi-selection of constituencies.
- Refactor to MVC architecture (in progress; data model done).
- Stacked graph view for selected constituencies over time.
- Politician voting record lookup.
- Material design draggable details bar.
- Show city names on the map.
- Other countries.

Feel free to explore, analyze, and enjoy the journey through the political history of the United Kingdom with our electoral data visualization web page!