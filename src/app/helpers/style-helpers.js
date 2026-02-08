import {makeStyles} from "@mui/styles";

const useProsERPStyles = makeStyles(theme => ({
  hiddenOnPrint: {
    '@media print': {
      display: 'none',
    },
  }
}));

export default useProsERPStyles;