# Data Imports

To add data into the system, the first step needed is to create a superuser account. Check the [index.md](/docs/index.md#initialize-the-project) for instructions on how to do it.

With the superuser account, you can login on the Administration Interface. The URL will be: `{backend-url}/admin`.

Once logged in, you will see a screen like this:

<img width="2764" height="1492" alt="image" src="https://github.com/user-attachments/assets/109f4712-9577-4bef-8b4c-153620f3a2b1" />

## Adding data

We can add data by uploading raster files (TIFF or VRT format), vector files in the GeoJSON format or Tabular data in CSV format.
However, before uploading data, you should create the Clusters, and the Dataset entries.

### Creating clusters

On the Administrative Interface, click on Clusters, then on `Add Cluster` button.

You will see a form like this. Add a name and click on Save.

<img width="50%" alt="image" src="https://github.com/user-attachments/assets/c7f62081-3d2f-4fa7-8b24-0a8c032a018c" />

If you need to modify or delete a Cluster, you can do it by accessing the Cluster list page in the administrative interface.

Clicking on the id of the cluster, you will have access to the form to modify it. If you need to delete clusters, select it and then click on the action dropdown and select `Delete selected clusters`. Finally, click on the `Go` button.

<img width="50%" alt="image" src="https://github.com/user-attachments/assets/01f27226-566e-44c4-b279-6c818b53ff2e" />


### Creating datasets

The exact same pattern applies when creating Raster, Vector or Tabular datasets. Here you can see the Raster Dataset creation form:

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/01a838fb-8ab1-4cef-bab7-e1ebf624fa8e" />

The forms to create Vector and Tabular datasets are very similar to the Raster one.

### Uploading data

The last and most important step of the data import is to upload the files containing each datasets data.

### Tabular data

Click on the `Tabular Items` link in the Administrative Interface homepage. Then, click on `Import File` in the right-top corner of the page.

<img width="2210" height="1006" alt="image" src="https://github.com/user-attachments/assets/65dc540a-9bdf-4690-ab65-6d005aa22d96" />

Once clicked, you will see a form like this, where you can upload a CSV file and select the dataset to which the data belongs to:

<img width="80%" alt="image" src="https://github.com/user-attachments/assets/2702ae31-a4ec-4cfa-b782-7045876314c4" />

The CSV file needs to be separated by commas and should have the following columns:

- Year
- Month `(optional)`
- Province `(optional)`
- Area Council `(optional)`
- Attribute
- Value

The name of the columns can be in lower, UPPER, or Camel Case. You can upload a file with additional columns, and the additional information will be stored in the database.

### Vector data

Click on the `Vector Items` link in the Administrative Interface homepage. Then, click on `Import File` in the right-top corner of the page.

<img width="2204" height="928" alt="image" src="https://github.com/user-attachments/assets/b6cd7cab-c9bd-4956-87f2-08268d848602" />

Once clicked, you will see a form like this, where you can upload a GeoJSON file and select the dataset to which the data belongs to:

<img width="50%" alt="image" src="https://github.com/user-attachments/assets/e65938e5-43b0-405d-9fdd-446b182a4e88" />

If you have never worked with GeoJSON files, you can convert any geospatial data format to GeoJSON using QGIS or ArcGis. The items in the GeoJSON file should have the following columsn:

- Name `(optional)`
- Ref `(optional)`
- Province `(optional)`
- Area Council `(optional)`
- Attribute `(optional)`
