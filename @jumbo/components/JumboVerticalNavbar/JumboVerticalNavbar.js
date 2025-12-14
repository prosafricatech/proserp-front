import React from 'react';
import JumboNavIdentifier from "@jumbo/components/JumboVerticalNavbar/JumboNavIdentifier";
import List from "@mui/material/List";
import PropTypes from 'prop-types';
import { SIDEBAR_VIEWS } from '@jumbo/utilities/constants';
import { useJumboLayout } from '../JumboLayout/hooks';

const JumboVerticalNavbar = ({items}) => {
    const { sidebarOptions } = useJumboLayout();

    const isMiniAndClosed = React.useMemo(() => {
        return sidebarOptions?.view === SIDEBAR_VIEWS.MINI && !sidebarOptions?.open;
    }, [sidebarOptions.view, sidebarOptions.open]);

    return (
        <List
            disablePadding
            sx={{
                mr: isMiniAndClosed ? 0 : 2,
                pb: 2
            }}
        >
            {
                items.map((item, index) => (
                    <JumboNavIdentifier item={item} key={index} />
                ))
            }
        </List>
    );
};

JumboVerticalNavbar.propTypes = {
    items: PropTypes.array,
};

export default JumboVerticalNavbar;