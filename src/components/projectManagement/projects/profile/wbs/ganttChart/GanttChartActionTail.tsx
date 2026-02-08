import { faChartGantt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonGroup, Dialog, IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import GanttChart from "./GanttChart";

const GanttChartActionTail = () => {
    const [openGanttChart, setOpenGanttChart] = useState(false);
  
    return (
        <React.Fragment>
            <Dialog maxWidth="xl" fullWidth fullScreen={true} open={openGanttChart}>
                <GanttChart setOpenGanttChart={setOpenGanttChart}/>
            </Dialog>
    
            <ButtonGroup variant="outlined" size="small" disableElevation sx={{ '& .MuiButton-root': { px: 1 } }}>
                <Tooltip title={"Gantt Chart"}>
                    <IconButton onClick={() => setOpenGanttChart(true)}>
                        <FontAwesomeIcon size='xs' icon={faChartGantt}/>
                    </IconButton>
                </Tooltip>
            </ButtonGroup>
        </React.Fragment>
    );
  };

  export default GanttChartActionTail;