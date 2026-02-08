import JumboContentLayoutContext from "@jumbo/components/JumboContentLayout/JumboContentLayoutContext";
import React from "react";

const useJumboContentLayout = () => {
    return React.useContext(JumboContentLayoutContext);
};

export default useJumboContentLayout;