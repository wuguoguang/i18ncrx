
import { Breadcrumb, Button, message } from "@pionex-web-kit/components";
import { IconRightArrow12pxRegular, IconWarning20pxBoldS } from "@pionex-web-kit/icons";
import { AccountType, RequestVerifyDataParam, VerifyCodeAction, AccountUnBindSession } from "bu_account_js_sdk";
import { useTranslators } from "commonUse/Locale";
import useAccountInfo from "commonUse/useAccountInfo";
import React, { memo, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router";
import { Link } from "react-router-dom";
import { CodeInputGroup, requestReCaptcha, SendType, requestGtCaptcha, requestHCaptcha } from "@pionex-web-kit/pro-components";
// import { useAccountInfo } from "src/redux/AccountInfo";
import AccountManager from "utils/AccountManager";
import { OtpState } from "state/AccountInfo";

import { useAvailableVerifyInfo } from "account/hook";

/**
 * 解绑手机或邮箱
 */
const AccountUnBind: React.FC = () => {
    const [verifyConfig, setVerifyConfig] = useState<RequestVerifyDataParam>();
    const [verifying, setVerifying] = useState(false);
    const { unbindType = AccountType.email } = useParams<{ unbindType: AccountType }>();
    const {
        $st,
        intl: { locale },
    } = useTranslators();
    const accountInfo = useAccountInfo();
    const verifyInfo = useAvailableVerifyInfo();
    const history = useHistory();
    const onSubmit = (verifyData) => {
        setVerifying(true);
        verifyConfig?.callback(verifyData); // 提交验证
    };
    const { accountPhone, accountEmail } = useMemo(() => {
        let accountPhone = "";
        let accountEmail = "";
        accountInfo?.accounts?.forEach((item) => {
            if (item.account_type === AccountType.email) {
                accountEmail = item.account;
            } else if (item.account_type === AccountType.phoneNumber) {
                accountPhone = item.account;
            }
        });

        return {
            accountPhone,
            accountEmail,
        };
    }, [accountInfo]);
    const onUnbind = () => {
        const _unbindAccountS = new AccountUnBindSession({
            buAccount: AccountManager.shared.buAccount,
            lang: locale,
            requestHCaptcha: (params) => {
                return requestHCaptcha({ ...params, lang: "en" } as any);
            },
            requestGtCaptcha,
            requestReCaptcha: (params) => {
                return requestReCaptcha({ ...params, lang: "en" } as any);
            },
            requestVerifyData: (requestParams) => {
                setVerifying(false);
                setVerifyConfig(requestParams);
            },
            requestPassword: (callback) => callback(""),
            onCancel: () => {
                setVerifyConfig(undefined);
                setVerifying(false);
            },
            onSuccess: () => {
                setVerifying(false);
                message.success($st(unbindType === AccountType.phoneNumber ? "account_phone_unbind_success" : "account_email_unbind_success"));
                AccountManager.shared.refreshAccountInfo(true);
                setTimeout(() => {
                    history.push("/my_profile");
                }, 1000);
            },
            onError: (error) => {
                setVerifyConfig(undefined);
                setVerifying(false);
                if (error.code === -10) {
                    // 取消不提示
                    return;
                } else {
                    message.error(AccountManager.parseErrorTips(error));
                }
            },
        });
        setVerifying(true);
        if (unbindType === AccountType.phoneNumber) {
            _unbindAccountS.start(accountPhone, AccountType.phoneNumber);
        } else {
            _unbindAccountS.start(accountEmail, AccountType.email);
        }
    };
    const accountTitle = $st(unbindType === AccountType.phoneNumber ? "account_unbind_phone" : "account_unbind_email");
    return (
        <div className=" flex flex-col w-screen min-h-[calc(100vh_-_60px)] bg-card px-[30px] pb-[50px]">
            <Breadcrumb className="my-[24px]">
                <Breadcrumb.Item>
                    <Link to="/my_profile">{$st("header.account.menu.accSetting")}</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{accountTitle}</Breadcrumb.Item>
            </Breadcrumb>
            <div className="w-[448px] mx-auto mt-[20px] flex flex-col items-center">
                {verifyConfig ? (
                    <>
                        <div className=" mt-16px mb-20px text-center text-[28px] font-semibold leading-[40px]">{accountTitle}</div>
                        <div className="w-full">
                            <CodeInputGroup
                                params={{
                                    account: verifyInfo.account,
                                    action: VerifyCodeAction.account_unbind,
                                    sendType: SendType.hasSent,
                                    verifyTypes: verifyConfig.verifyTypes,
                                    token: verifyConfig?.paramData?.verification_code_token_data?.token,
                                    maskAccounts: verifyInfo.maskAccounts,
                                }}
                                verify={onSubmit}
                            />
                        </div>

                        <Button loading={!!verifying} htmlType="submit" form="codeInputForm" type="primary" shape="round" size="large" className="w-full mt-36px">
                            {$st("kyc_Bbutton_submint")}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col items-center">
                            <IconWarning20pxBoldS className=" w-[100px] h-[100px]" />
                            <div className=" text-accent text-xl mt-[10px] font-m">{$st("unbinding_prompt")}</div>
                        </div>
                        <div className="mt-20px">{$st("account_unbind_hint_content", { day: "30" })}</div>
                        <Button shape="round" size="large" className=" w-full mt-[40px]" type="primary" onClick={onUnbind} loading={!!verifying}>
                            {$st("next_step")}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(AccountUnBind);
