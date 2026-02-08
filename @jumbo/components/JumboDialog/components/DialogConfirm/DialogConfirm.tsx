import Button from "@mui/material/Button";
import { useJumboDialog } from "@jumbo/components/JumboDialog/hooks/useJumboDialog";
import DialogBase from "../DialogBase/DialogBase";
import { useDictionary } from "@/app/[lang]/contexts/DictionaryContext";

const DialogConfirm = ({ open = false, onYes, onNo, ...restProps }: any) => {
  const dictionary = useDictionary();
  const { hideDialog } = useJumboDialog();

  const handleClose = () => {
    onNo();
    hideDialog();
  };

  return (
    <DialogBase
      sx={{ "& .MuiPaper-root": { borderRadius: 2 } }}
      fullWidth
      maxWidth={"xs"}
      actions={
        <>
          <Button variant={"contained"} onClick={onYes}>
            {dictionary.forms.yes}
          </Button>
          <Button onClick={handleClose}>{dictionary.forms.no}</Button>
        </>
      }
      {...restProps}
    />
  );
};

export { DialogConfirm };
