# Library project

- Node project building a catalog and database for library books. Based on MDN Node.js project.

## Small Fixes Needed

- Logic for genre fields to be checked (not always correct)
- Check for workaround on select elements to display a selected element on return. Have not been able to get functioning in hbs in transfering from pug syntax in demo.
- Check for workaround on date input elements to display proper value with updating or returning body values. Have not been able to get functioning in hbs in transfering from pug syntax in demo.
  - Fixed with using virtual formatted version of the dates. Browser able to parse them. Need to go through and correct any that are incorrect.
- Dates show as one day behind the input date. Likely due to timezone issue that may take more research to resolve (possibly resolved with utc method in moment?)
- Use regex form validation to allow browser to stop non-alphanumeric entries. Currently server is validating this.
