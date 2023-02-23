import React, {ReactElement, useEffect, useState} from "react";
import PubSub from "pubsub-js";
import Toast from "react-uwp/Toast";
import Icon from "react-uwp/Icon";

const ToastHandler = ():ReactElement => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        PubSub.subscribe("toast", (message, args) => {
            const toast = {toast: args, show: true};
            close(toast, 3000);
            setToasts(toasts.concat(toast));
        });

    }, []);

    const close = (toast, closeDelay):void => {
        setTimeout(() => {
            const newToasts = toasts.slice(0);
            newToasts[newToasts.indexOf(toast)].show = false;
            setToasts(newToasts);
        }, closeDelay);
    };

    return (
        <>
            {toasts.slice(0).map((x, i) => (
                <Toast
                    key={i}
                    defaultShow={x.show}
                    logoNode={<Icon>{x.toast.logoNode}</Icon>}
                    title={x.toast.title}
                    showCloseIcon
                >
                    {x.toast.contents}
                </Toast>
            ))}
        </>
    );
};

export default ToastHandler;
