import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutConfig } from "src/components-v2/Layout";
import AccountInfo, { OtpState } from "state/AccountInfo";
import { ExchangeID } from "TradeAPILib";
import AccountManager from "utils/AccountManager";
import AvatarComponent from "./AvatarComponent";
import css from "./index.module.less";
import NicknameComponent from "./NicknameComponent";
import { catchError, flatMap, tap } from "rxjs/operators";
import { Observable } from "rxjs";
import { useTranslators } from "commonUse/Locale";
import { resetPageTitleAndDescription } from "utils/Utils";
import { showEnterLCEDialog } from "components/GuideEnterLCEDialog";
import { AccountType } from "bu_account_js_sdk";
import TReportLink, { Iconfont, TTooltip } from "components/v2/TinyComps";
import { useToggle } from "src/commonUse/tools";
import { TInput, TModal } from "src/components/v2/TinyComps";
import { history } from "..";
import useKycV2Info, { KycV2Level, KycV2LevelStatus, useShowKycReasonModal } from "commonUse/useKycInfoV2";
import useMedia from "src/components-v2/Layout/hooks/useMedia";
import useAccountInfo from "commonUse/useAccountInfo";
import useTheme from "commonUse/useTheme";
import { LANGUAGE_LOCALS_MAP } from "utils/i18n";
import useUNSAFE_JoinInternalTest from "commonUse/useJoinInternalTest";
import { Button, Input, message } from "@pionex-web-kit/components";
import classNames from "classnames";
import Constants from "utils/Constants";

function useAccountByType(accountInfo: AccountInfo, type: AccountType) {
    return useMemo(() => accountInfo.accounts.find((item) => item.account_type === type), [accountInfo.accounts, type]);
}

export default function MyProfile() {
    const accountInfo = useAccountInfo();
    const theme = useTheme();
    const {
        $st,
        intl: { locale },
    } = useTranslators();
    const { isDeviceMobile } = useMedia();

    useEffect(() => {
        window.document.title = "my_profile_page_title";
        return () => resetPageTitleAndDescription($st);
    }, [$st]);

    const [referralsAlertVisible, { toggle: setReferralsAlertVisible }] = useToggle();
    const [refeeralsCodeValue, setRefeeralsCodeValue] = useState("");
    const [inviterCode, setInviterCode] = useState("");

    const showKycReasonModal = useShowKycReasonModal();

    /**
     * @description: 绑定邮箱或手机
     * @param {*}
     * @return {*}
     */
    const bindAccount = () => {
        history.push("/account/bind");
    };
    /**
     * @description: 解绑邮箱
     * @param {*}
     * @return {*}
     */
    const unBindEmail = () => {
        message.destroy();
        if (!phoneAccount) {
            message.info("account_bind_phone_before_unbind_email");
            return;
        }
        if (accountInfo.otpState !== OtpState.BOUND) {
            message.info("account_bind_2fa_before_unbind");
            return;
        }

        history.push(`/account/unbind/${AccountType.email}`);
    };

    /**
     * @description: 解绑手机
     * @param {*}
     * @return {*}
     */
    const unBindPhone = () => {
        message.destroy();
        if (!emailAccount) {
            message.info("account_bind_email_before_unbind_phone");
            return;
        }
        if (accountInfo.otpState !== OtpState.BOUND) {
            message.info("account_bind_2fa_before_unbind");
            return;
        }

        history.push(`/account/unbind/${AccountType.phoneNumber}`);
    };

    const continuouslyClick10TimesToJoinBetaWithModuleId = useUNSAFE_JoinInternalTest();

    const updateInviter = useCallback((): Observable<any> => {
        return AccountManager.queryMyInviter().pipe(
            tap((data) => {
                if (data && data.share_code) {
                    setInviterCode(data.share_code);
                }
            }),
            catchError((error) => {
                console.log(error);
                throw error;
            }),
        );
    }, []);
    useEffect(() => {
        updateInviter().subscribe(
            () => {},
            () => {},
        );
    }, [updateInviter]);

    const needSetReferrals = !inviterCode;

    const onReferralsCodeChanged = useCallback((event) => {
        setRefeeralsCodeValue(event.target.value);
    }, []);

    const [referralsLoading, { toggle: toggleReferralsLoading }] = useToggle();
    const onReferralsCommit = useCallback(async () => {
        if (!refeeralsCodeValue) {
            message.error("error_not_fill_investor_referrals");
            return;
        }
        toggleReferralsLoading(true);
        AccountManager.pionexInviteObservable(refeeralsCodeValue)
            .pipe(
                catchError((error) => {
                    if ("code" in error) {
                        const code: number = error.code;
                        switch (code) {
                            case -99002: //没找到对应人
                                message.error("fill_referrals_error_not_found");
                                break;
                            case -20002: //绑定过别人了
                                message.error("fill_referrals_error_had_bound");
                                break;
                            case -30009: //已经进行开单了
                                message.error("fill_referrals_error_had_order");
                                break;
                            case -30008: //过期了
                                message.error("fill_referrals_error_expired");
                                break;
                            case -30007: //绑定循环了
                                message.error("fill_referrals_error_had_circle");
                                break;
                            case 40000300:
                                message.error("kol_rebate_invite_bind_expired");
                                break;
                            case -30016: // 不允许跨站
                                message.error("invite_rebate_code");
                                break;
                            default:
                                message.error(JSON.stringify(error));
                                break;
                        }
                    }
                    throw error;
                }),
            )
            .pipe(
                flatMap(() => {
                    return updateInviter();
                }),
            )
            .subscribe(
                () => {
                    toggleReferralsLoading(false);
                    setReferralsAlertVisible(false);
                    message.success("filled_success");
                },
                (error) => {
                    console.log(error);
                    toggleReferralsLoading(false);
                },
            );
    }, [$st, refeeralsCodeValue, setReferralsAlertVisible, toggleReferralsLoading, updateInviter]);

    const phoneAccount = useAccountByType(accountInfo, AccountType.phoneNumber);
    const emailAccount = useAccountByType(accountInfo, AccountType.email);
    const firstAccount = (accountInfo.accounts || [])[0];

    const [kycV2Info, kycV2Loading] = useKycV2Info();

    // FIXME: [FOR_OLD_KYC] 正式上线前需要移除
    const KycV1Status = useMemo(() => {
        const { currentLevel, kycDestination, forwardLevelMap } = kycV2Info;
        if (!currentLevel) return <div>{"kyc_none"}</div>;
        const kycOldLv2Info = forwardLevelMap.get(KycV2Level.oldLv2);
        const kycEntry = kycDestination ? (kycDestination === "v1" ? "/verification" : "/account/kyc") : undefined;
        switch (kycOldLv2Info.status) {
            case KycV2LevelStatus.passed:
                return (
                    <div className={css.kyc_upErrorText}>
                        <div>{"kyc_success"}</div>
                        <div className={`${css.kyc_uptextlength} ${css.itemOperation}`} />
                    </div>
                );
            case KycV2LevelStatus.halfFailed:
            case KycV2LevelStatus.failed:
                return (
                    <div className={css.kyc_upErrorText}>
                        <div>{"kyc_failed"}</div>
                        <div
                            className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}
                            onClick={() =>
                                showKycReasonModal({
                                    locale,
                                    $st,
                                    kycDestination,
                                    forwardLevelInfo: kycV2Info.forwardLevelMap.get(KycV2Level.oldLv2),
                                    okText: "kyc_button_Resubmit",
                                    onOk() {
                                        kycEntry && history.push(kycEntry);
                                    },
                                })
                            }
                        >
                            {"kyc_button_Resubmit"}
                        </div>
                    </div>
                );
            case KycV2LevelStatus.reviewing:
                return (
                    <div className={css.kyc_upErrorText}>
                        <div>{"kyc_verifying"}</div>
                        <div className={`${css.kyc_uptextlength} ${css.itemOperation}`} />
                    </div>
                );
            case KycV2LevelStatus.notStarted:
            default:
                return (
                    <div className={css.kyc_upErrorText}>
                        <div className={css.kyc_noneText}>{"kyc_none"}</div>
                        <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                            <TReportLink to={kycEntry}> {"kyc_button_apply"} </TReportLink>
                        </div>
                    </div>
                );
        }
    }, [kycV2Info, $st, showKycReasonModal, locale]);

    const KycV2Status = useMemo(() => {
        const { currentLevel, kycDestination } = kycV2Info;
        if (!kycDestination) return null;
        switch (currentLevel) {
            case KycV2Level.oldLv1:
            case KycV2Level.lv0:
                return kycDestination === "v2" ? (
                    <div className={css.kyc_upErrorText}>
                        <div className={css.kyc_noneText}>{"kyc_none"}</div>
                        <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                            <TReportLink to="/account/kyc"> {"kyc_button_apply"} </TReportLink>
                        </div>
                    </div>
                ) : (
                    // 显示老入口
                    KycV1Status
                );
            case KycV2Level.lv1:
                if (PLATFORM.PIONEX_US_LIKE)
                    return (
                        <div className={css.kyc_upErrorText}>
                            <div className={css.kyc_noneText}>{"kyc_none"}</div>
                            <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                                <TReportLink to="/account/kyc"> {"kyc_button_apply"} </TReportLink>
                            </div>
                        </div>
                    );
                return (
                    <div className={css.kyc_upErrorText}>
                        <div className={css.kyc_noneText}>{"kyc_l1_title"}</div>
                        <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                            <TReportLink to="/account/kyc"> {"kyc_go_upgrade"} </TReportLink>
                        </div>
                    </div>
                );
            case KycV2Level.oldLv2:
            case KycV2Level.lv2:
                return kycDestination === "v2" ? (
                    PLATFORM.PIONEX_US_LIKE ? (
                        <div className={css.kyc_upErrorText}>
                            <div className={css.kyc_noneText}>{"kyc_success"}</div>
                            <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                                <TReportLink to="/account/kyc"> {"deposit_maintain_check"} </TReportLink>
                            </div>
                        </div>
                    ) : (
                        <div className={css.kyc_upErrorText}>
                            <div className={css.kyc_noneText}>{"kyc_l2_title"}</div>
                            <div className={`${css.kyc_uptextlength} ${css.kyc_none_border}`}>
                                <TReportLink to="/account/kyc"> {"deposit_maintain_check"} </TReportLink>
                            </div>
                        </div>
                    )
                ) : (
                    // 显示老入口
                    KycV1Status
                );

            default:
                // 当kyc等级为 null 时，不做任何处理，以免进入到错误的kyc逻辑
                return null;
        }
    }, [kycV2Info, $st, KycV1Status]);
    return (
        <LayoutConfig requireLogin loading={!accountInfo.userId || !accountInfo.accounts || kycV2Loading} className={css.contentBox}>
            <div className={css.cardContainer}>
                <div className={classNames(isDeviceMobile ? css.kycMobileCard : css.card, "flex flex-col justify-between")}>
                    <div className="flex items-center mb-16px !flex-col">
                        <div className="flex items-center mb-16px justify-between w-full">
                            <div>{"account_account"}</div>
                            <div className={css.itemValue} onClick={continuouslyClick10TimesToJoinBetaWithModuleId}>
                                {firstAccount.account}
                            </div>
                        </div>
                        <div className="flex items-center mb-16px justify-between w-full">
                            <div>{"profile_nickname"}</div>
                            <div className={css.itemValue} style={{ whiteSpace: "normal", wordBreak: "normal" }}>
                                <NicknameComponent theme={theme} accountInfo={accountInfo} />
                            </div>
                        </div>
                        <div className="flex items-center mb-16px justify-between w-full">
                            <div>{"settings_profile_photo"}</div>
                            <div className={css.itemValue}>
                                <AvatarComponent accountInfo={accountInfo} />
                            </div>
                        </div>
                    </div>
                    <div className="">
                        <Button type="link" href={`/${locale}/close-account`} className="p-0 leading-none">
                            {"close_account"}
                        </Button>
                    </div>
                </div>

                <div className={`${isDeviceMobile ? css.kycMobileCard : css.card} ${css.right}`}>
                    <div>
                        <Iconfont icon={"icon_Password"} className={css.itemIcon} />
                        <div>{"account_password"}</div>
                        <div className={css.itemValue}>{"account_password_encrypted"}</div>
                        <div className={`${css.itemOperation} ${css.kyc_none_border}`}>
                            <a href={Constants.accountsRoute.resetPassword}>{"button_reset"}</a>
                        </div>
                    </div>
                    <div className={isDeviceMobile ? css.kycMobileItemValue : ""}>
                        <Iconfont icon={"icon_GoogleAuthenticator"} className={css.itemIcon} />
                        <div style={{ transform: isDeviceMobile ? "translateX(0)" : "translateX(0px)" }}>
                            {"google_authenticator"}
                            {[LANGUAGE_LOCALS_MAP.zhCN, LANGUAGE_LOCALS_MAP.zhTW].includes(locale as any) && "google_Authentication_chino"}
                        </div>
                        <div className={isDeviceMobile ? "" : css.itemValue}>
                            {accountInfo.otpState !== OtpState.BOUND ? (
                                "not_set"
                            ) : (
                                // <Link to="/googleAuthenticator">{`${"google_authenticator_bind_button"} >`}</Link>
                                <div className={css.itemValue}>{"google_authenticator_binded"}</div>
                            )}
                        </div>
                        <div className={`${css.itemOperation} ${css.kyc_none_border}`}>
                            <Link to="/googleAuthenticator">{accountInfo.otpState === OtpState.BOUND ? "google_authenticator_unbind_button" : "set_big"}</Link>
                        </div>
                    </div>
                    {PLATFORM.PIONEX_US_LIKE && (
                        <div>
                            <Iconfont icon={"iocn_PhoneVerification"} className={css.itemIcon} />
                            <div>{"account_bind_title_phone"}</div>
                            <div className={css.itemValue}>{!!phoneAccount ? "google_authenticator_binded" : "google_authenticator_unbinded"}</div>
                            {!phoneAccount ? (
                                <div className={`${css.itemOperation} ${css.kyc_none_border}`}>
                                    <Link to="/account/bind">{"google_authenticator_bind"}</Link>
                                </div>
                            ) : (
                                <div className={`${css.itemOperation}  ${css.kyc_none_border} `} onClick={unBindPhone}>
                                    {"google_authenticator_unbind_button"}{" "}
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <Iconfont icon={"icon_EmailVerification"} className={css.itemIcon} />
                        <div>{"account_bind_title_email"}</div>
                        <div className={css.itemValue}>{!!emailAccount ? "google_authenticator_binded" : "google_authenticator_unbinded"}</div>
                        {!emailAccount ? (
                            <div className={`${css.itemOperation} ${css.kyc_none_border}`}>
                                <Link to="/account/bind">{"google_authenticator_bind"}</Link>
                            </div>
                        ) : (
                            <div className={`${css.itemOperation}  ${css.kyc_none_border} `} onClick={unBindEmail}>
                                {"google_authenticator_unbind_button"}{" "}
                            </div>
                        )}
                        {/* <div className={`${css.itemOperation} ${css.kyc_none_border}`} onClick={emailAccount ? unBindEmail : bindAccount}>
                            {emailAccount ? "google_authenticator_unbind_button" : "set_big"}
                        </div> */}
                    </div>

                    {accountInfo.apiKeys?.[0].exchange === ExchangeID.PIONEXV2 ? (
                        <div>
                            <Iconfont icon={"icon_KYC"} className={css.itemIcon} />
                            <div className={css.label}>
                                <span>{"account_kyc_info"}</span>
                                {/* FIXME: 兼容老版kyc */}
                                {kycV2Info.kycDestination === "v1" && (
                                    <TTooltip title={<span className={css.tipsContent}>{"profile_kyc_tips"}</span>} className={css.tips}>
                                        <Iconfont icon="icon_information" />
                                    </TTooltip>
                                )}
                            </div>
                            <div className={css.itemValue}>{KycV2Status}</div>
                        </div>
                    ) : (
                        <div>
                            <Iconfont icon={"icon_KYC"} className={css.itemIcon} />
                            <div>{"account_kyc_info"}</div>
                            <div className={css.itemValue}>{"coming_soon"}</div>
                            <div className={css.itemOperation} />
                        </div>
                    )}

                    <div>
                        <Iconfont icon={"icon_Referrals"} className={css.itemIcon} />
                        <div>{"account_referrals"}</div>
                        <div className={css.itemValue}>{needSetReferrals ? "not_set" : inviterCode}</div>

                        {needSetReferrals ? (
                            <TModal
                                trigger={
                                    <div
                                        className={`${css.itemOperation} ${css.kyc_none_border}`}
                                        onClick={() => {
                                            setReferralsAlertVisible(true);
                                        }}
                                    >
                                        {"set_big"}
                                    </div>
                                }
                                title={"fill_investor_referrals_title"}
                                visible={referralsAlertVisible}
                                onOk={onReferralsCommit}
                                confirmLoading={referralsLoading}
                                onCancel={setReferralsAlertVisible}
                                closable={true}
                                maskClosable={true}
                            >
                                <div>
                                    {needSetReferrals ? (
                                        <div>
                                            <div className="mb-[20px]">{"fill_referrals_tip"}</div>
                                            <Input value={refeeralsCodeValue} label={"investor_referrals_code"} onChange={onReferralsCodeChanged} />
                                        </div>
                                    ) : (
                                        <>
                                            <div>{"had_fill_referrals_code"}</div>
                                            <div>{inviterCode}</div>
                                            <div>{"can_not_fill_again"}</div>
                                        </>
                                    )}
                                </div>
                            </TModal>
                        ) : (
                            <div className={`${css.itemOperation} ${css.disable}`}></div>
                        )}
                    </div>

                    {PLATFORM.PIONEX_US_LIKE || (
                        <>
                            {/* 是否通过杠杆代币测试 */}
                            <div>
                                <Iconfont icon={"icon_LeveragedTokensTest"} className={css.itemIcon} />
                                <div>{"leverage_coin_test"}</div>
                                <div className={css.itemValue}>{accountInfo.passLCExam ? "leverage_coin_exam_pass" : "leverage_coin_exam_not_pass"}</div>
                                {accountInfo.passLCExam ? (
                                    <div className={`${css.itemOperation}`} />
                                ) : (
                                    <div
                                        className={`${css.itemOperation} ${css.kyc_none_border}`}
                                        onClick={() => {
                                            showEnterLCEDialog();
                                        }}
                                    >
                                        <div>{"start_answer"}</div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/*<ConfirmationModal />*/}
        </LayoutConfig>
    );
}
