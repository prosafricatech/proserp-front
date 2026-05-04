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
        onValueChange={(values, sourceInfo) => {
          // Only propagate changes from actual user input, not mount/prop changes.
          // This prevents infinite loops when sibling fields remount each other via key changes.
          if (sourceInfo?.source !== 'event') return;
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