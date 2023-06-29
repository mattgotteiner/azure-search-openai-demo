import { Example } from "./Example";

import styles from "./Example.module.css";

export type ExampleModel = {
    text: string;
    value: string;
};

const EXAMPLES: ExampleModel[] = [
    {
        text: "What investments are being made to deal with climate change for FY 2024?",
        value: "What investments are being made to deal with climate change for FY 2024?"
    },
    { text: "Provide a detailed list of successes for ICE in previous fiscal years.", value: "Provide a detailed list of successes for ICE in previous fiscal years." },
    { text: "Tell me about the nonprofit security grant program.", value: "Tell me about the nonprofit security grant program." }
];

interface Props {
    onExampleClicked: (value: string) => void;
}

export const ExampleList = ({ onExampleClicked }: Props) => {
    return (
        <ul className={styles.examplesNavList}>
            {EXAMPLES.map((x, i) => (
                <li key={i}>
                    <Example text={x.text} value={x.value} onClick={onExampleClicked} />
                </li>
            ))}
        </ul>
    );
};
