import { DeleteOutlineOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { Stack } from "@mui/system";

export default function BulkActions(){
    return (
        <Stack direction={"row"} sx={{ backgroundColor: 'transparent', ml: -2}}>
            <Tooltip title={"Delete"}>
                <IconButton color="error">
                    <DeleteOutlineOutlined />
                </IconButton>
            </Tooltip>
        </Stack>
    );
}