import { useContractAction } from '@/hooks/contract.hooks';
import { useWorkspaceActions } from '@/hooks/workspace.hooks';
import { ABI } from '@/interfaces/workspace.interface';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Button, Form, message } from 'antd';
import { FC, useEffect, useRef, useState } from 'react';
import ABIUi from '../ABIUi';
import s from './ContractInteraction.module.scss';

interface Props {
  contractAddress: string;
  projectId: string;
  abi: ABI[];
}
const ContractInteraction: FC<Props> = ({
  contractAddress,
  projectId,
  abi,
}) => {
  const [tonConnector] = useTonConnectUI();
  const [isLoading, setIsLoading] = useState('');
  const { sendMessage } = useContractAction();
  const { getFileByPath } = useWorkspaceActions();

  const cellBuilderRef = useRef<HTMLIFrameElement>(null);

  const createCell = () => {
    if (!cellBuilderRef.current?.contentWindow) return;
    const contractCellData = getFileByPath('contract.cell.js', projectId);
    if (contractCellData && !contractCellData.content) {
      message.error('Cell data is missing in file contract.cell.js');
      return;
    }
    if (!contractCellData?.content?.includes('cell')) {
      message.error('cell variable is missing in file contract.cell.js');
      return;
    }
    cellBuilderRef.current.contentWindow.postMessage(
      {
        name: 'nujan-ton-ide',
        type: 'abi-data',
        code: contractCellData?.content,
      },
      '*'
    );
  };

  const onSubmit = async (formValues: any) => {
    if (!tonConnector) {
      message.warning('Wallet not connected');
      return;
    }

    try {
      setIsLoading('setter');
      createCell();
    } catch (error: any) {
      console.log(error);
      if (error.message.includes('Wrong AccessKey used for')) {
        message.error('Contract address changed. Relogin required.');
      }
    } finally {
    }
  };

  useEffect(() => {
    const handler = async (
      event: MessageEvent<{ name: string; type: string; data: any }>
    ) => {
      if (
        !event.data ||
        typeof event.data !== 'object' ||
        event.data?.type !== 'abi-data' ||
        event.data?.name !== 'nujan-ton-ide'
      ) {
        return;
      }

      try {
        if (!tonConnector) {
          message.warning('Wallet not connected');
          return;
        }

        await sendMessage(event.data.data, contractAddress);
      } catch (error) {
        console.log('error', error);
      } finally {
        setIsLoading('');
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!contractAddress) {
    return <></>;
  }

  return (
    <div className={s.root}>
      <iframe
        className={s.cellBuilderRef}
        ref={cellBuilderRef}
        src="/html/tonweb.html"
      />
      <p>
        <b>
          This will be used to send internal message and call getter method on
          contract
        </b>
      </p>
      <br />

      {abi && abi.length > 0 && (
        <>
          <h3 className={s.label}>Getter:</h3>
          {abi.map((item, i) => (
            <ABIUi abi={item} key={i} contractAddress={contractAddress} />
          ))}
        </>
      )}
      <br />
      <h3 className={s.label}>Setter:</h3>
      <p>Update values in contract.cell.js and send message</p>
      <Form className={s.form} onFinish={onSubmit}>
        <Button
          type="default"
          htmlType="submit"
          loading={isLoading === 'setter'}
        >
          Send Internal Message
        </Button>
      </Form>
    </div>
  );
};

export default ContractInteraction;