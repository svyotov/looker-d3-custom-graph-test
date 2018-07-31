# Introduction 
Custom Visualizations for Looker in TypeScript with Highcharts/d3

# Build Development Environment

The development environment is built off of Webpack / webpack-dev-server. This means that you will have
a node server running in the background so you should have nodejs installed.

#####Start the server

1.	run `npm install`
2.  run `npm run webpack` or start the `script` labeled `webpack-dev-server` in the `package.json`


####Developing a Custom Visualization locally

1.  Add a `TypeScript` file in the `visualizations` directory
2.  Referencing the `Boiler Plate Code` below, create your basic Visualization
3.  Add the reference to your newly created custom Visualization file in the `webpack.config.js` file (follow the same setup for `forecasting.ts`)
4.  Start the server (See `Start the server`)

####Adding a reference to the locally hosted visualization

1.  Go to the [Admin Page](https://headset.looker.com/admin/visualizations) in Looker
2.  Go to the Visualizations page and add a new visualization with the local url reference to the file

    - ID: my-viz-dev
    - Label: My Vis - Development
    - Main: https://localhost:3443/my-viz-dev.js



#Build for Production

1. Add the entry file path to the `webpack.config.js` (Follow same pattern as `forecast.ts` entry in `webpack.config.js`)
2. run `webpack`
3. Upload your custom visualization code (ie: /dist/forecast.js) to [Azure Blob Storage](https://portal.azure.com/#blade/Microsoft_Azure_Storage/ContainerMenuBlade/overview/storageAccountId/%2Fsubscriptions%2Fb6bf6da9-2af8-4569-8e40-f4041bdff787%2FresourceGroups%2FDefault-Storage-SouthCentralUS%2Fproviders%2FMicrosoft.ClassicStorage%2FstorageAccounts%2Fheadsetstorage/path/looker/etag/%220x8D5DDD8221A075D%22)
4. Go to the [Admin Page](https://headset.looker.com/admin/visualizations) in Looker to add your Visualization
5. Select the Visualization you want to use in the dropdown on the Explore to use it.


#Boiler Plate Code

    import { Looker, VisualizationDefinition } from '../common/types';
    import { handleErrors } from '../common/utils';
    
    declare var looker: Looker;
    
    interface WhateverNameYouWantVisualization extends VisualizationDefinition {
        elementRef?: HTMLDivElement,
        dimension?: string,
        measure?: string,
        alpha?: any,
        beta?: any,
        gamma?: any,
        period?: any,
        m?: any
    }
    
    const vis: WhateverNameYouWantVisualization = {
        id: 'forecasting', // id/label not required, but nice for testing and keeping manifests in sync
        label: 'Forecast',
        options: {
            title: {
                type: 'string',
                label: 'Title',
                display: 'text',
                default: 'Sales Forecast'
            }
        },
        // Set up the initial state of the visualization
        create(element, config) {
            this.elementRef = element;
        },
        // Render in response to the data or settings changing
        update(data, element, config, queryResponse) {
            console.log( 'data', data );
            console.log( 'element', element );
            console.log( 'config', config );
            console.log( 'queryResponse', queryResponse );
            const errors = handleErrors(this, queryResponse, {
                min_pivots: 0,
                max_pivots: 0,
                min_dimensions: 1,
                max_dimensions: 1,
                min_measures: 1,
                max_measures: 1
            });
            if (errors) { // errors === true means no errors
                // TODO: Do stuff here
            }
        }
    };
    
    looker.plugins.visualizations.add(vis);

# General Info
 - [Custom Viz Examples](https://github.com/looker/custom_visualizations_v2)
 - [Nostradamus](https://github.com/wdamron/Nostradamus.js)