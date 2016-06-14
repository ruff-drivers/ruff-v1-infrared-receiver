export declare class IRR extends RuffDevice {
    /**
     * emit `data` event when IRR receive valid signal
     * @param data the data of received singal
     */
    on(event: 'data', listener: (data: number[]) => void): this;
}

export default IRR;
