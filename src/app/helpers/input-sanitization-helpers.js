import dayjs from "dayjs";

//Remove commas from separated number format
export function sanitizedNumber(number){
    return typeof number === 'string' ? parseFloat(number.replace(/,/g, '')) : number;
}

export function MySQLDateTimeString(date){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function readableDate(dateString, withTime = true) {
    const formatString = `DD MMM YYYY${withTime ? ' HH:mm' : ''}`;
    return dayjs(dateString).format(formatString);
}

export function readableTime(timeString, withSeconds = false) {
    const formatString = `HH:mm${withSeconds ? ':ss' : ''}`;
    return dayjs(timeString).format(formatString);
}

export function autocompleteTreeOptions(tree,treeLevel = -1,options = []) {
    treeLevel = treeLevel+1;
    tree.map(parent => {
        options.push({id : parent.id, name : parent.name});
        parent.children.length > 0 && autocompleteTreeOptions(parent.children,treeLevel,options);
    });
    return options;
}

export function shortNumber(value){
    let shortNumber = value;

      if(Math.abs(value) > 100000){
        shortNumber = `${value / 1000}K`
      }

      if(Math.abs(value) > 1000000){
        shortNumber = `${value / 1000000}M`
      }

      if(Math.abs(value) > 1000000000){
        shortNumber = `${value / 1000000000}B`
      }
      return shortNumber;
}
