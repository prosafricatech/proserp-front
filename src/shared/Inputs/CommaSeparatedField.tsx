import React from 'react';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

interface CommaSeparatedFieldProps extends Omit<NumericFormatProps, 'onValueChange'> {
    onChange: (event: { target: { name?: string; value: string } }) => void;
    name?: string;
    [key: string]: any;
}

const CommaSeparatedField = React.forwardRef<HTMLInputElement, CommaSeparatedFieldProps>(
  (props, ref) => {
    const { onChange, ...other } = props;

    return (
      <NumericFormat
        {...other}
        getInputRef={ref}
        onValueChange={(values) => {
          onChange({
            target: {
              name: props.name,
              value: values.formattedValue,
            },
          });
        }}
        thousandSeparator
      />
    );
  }
);

CommaSeparatedField.displayName = 'CommaSeparatedField';

export default CommaSeparatedField;