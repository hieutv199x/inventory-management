"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import Label from '@/components/form/Label';
import Button from '@/components/ui/button/Button';
import LoadingButton from '@/components/ui/loading/LoadingButton';
import { useLanguage } from '@/context/LanguageContext';
import { shopGroupApi } from '@/lib/api-client';
import Select, { StylesConfig } from 'react-select';

export type GroupUserOption = {
    id: string;
    name: string;
    username: string;
};

interface CreateShopGroupModalProps {
    isOpen: boolean;
    onClose: () => void;
    users: GroupUserOption[];
    onSuccess: (message: string) => Promise<void> | void;
    onError: (message: string) => void;
}

const CreateShopGroupModal: React.FC<CreateShopGroupModalProps> = ({
    isOpen,
    onClose,
    users,
    onSuccess,
    onError,
}) => {
    const { t } = useLanguage();
    const [formState, setFormState] = useState({
        name: '',
        description: '',
        managerId: '',
        memberIds: [] as string[],
    });
    const [submitting, setSubmitting] = useState(false);
    const [localError, setLocalError] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(false);

    type MemberSelectOption = {
        value: string;
        label: string;
    };

    const selectStyles: StylesConfig<MemberSelectOption, true> = useMemo(() => ({
        control: (provided, state) => ({
            ...provided,
            minHeight: '2.5rem',
            borderColor: state.isFocused
                ? isDarkMode
                    ? 'rgb(147 197 253)'
                    : 'rgb(59 130 246)'
                : isDarkMode
                    ? 'rgb(55 65 81)'
                    : 'rgb(209 213 219)',
            boxShadow: state.isFocused
                ? isDarkMode
                    ? '0 0 0 1px rgba(147, 197, 253, 0.5)'
                    : '0 0 0 1px rgba(59, 130, 246, 0.5)'
                : 'none',
            backgroundColor: isDarkMode ? 'rgb(31 41 55)' : 'rgb(255 255 255)',
            color: isDarkMode ? 'rgb(229 231 235)' : 'rgb(17 24 39)',
            '&:hover': {
                borderColor: isDarkMode ? 'rgb(147 197 253)' : 'rgb(59 130 246)'
            },
            zIndex: 99999
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 30,
            backgroundColor: isDarkMode ? 'rgb(31 41 55)' : provided.backgroundColor,
            color: isDarkMode ? 'rgb(229 231 235)' : provided.color,
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: isDarkMode ? 'rgb(30 64 175)' : 'rgb(239 246 255)',
            color: isDarkMode ? 'rgb(191 219 254)' : 'rgb(37 99 235)'
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: isDarkMode ? 'rgb(191 219 254)' : 'rgb(37 99 235)'
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: isDarkMode ? 'rgb(191 219 254)' : 'rgb(37 99 235)',
            ':hover': {
                backgroundColor: isDarkMode ? 'rgb(30 64 175)' : 'rgb(191 219 254)',
                color: isDarkMode ? 'rgb(219 234 254)' : 'rgb(29 78 216)'
            }
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected
                ? isDarkMode
                    ? 'rgb(30 64 175)'
                    : 'rgb(219 234 254)'
                : state.isFocused
                    ? isDarkMode
                        ? 'rgb(30 64 175 / 0.75)'
                        : 'rgb(239 246 255)'
                    : provided.backgroundColor,
            color: isDarkMode ? 'rgb(229 231 235)' : 'rgb(17 24 39)'
        })
    }), [isDarkMode]);

    const additionalMemberOptions = useMemo(() => {
        if (!formState.managerId) {
            return users;
        }
        return users.filter((user) => user.id !== formState.managerId);
    }, [users, formState.managerId]);

    const memberSelectOptions = useMemo<MemberSelectOption[]>(
        () =>
            additionalMemberOptions.map((user) => ({
                value: user.id,
                label: `${user.name} (${user.username})`
            })),
        [additionalMemberOptions]
    );

    const selectedMemberOptions = useMemo<MemberSelectOption[]>(
        () => memberSelectOptions.filter((option) => formState.memberIds.includes(option.value)),
        [memberSelectOptions, formState.memberIds]
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        setFormState({ name: '', description: '', managerId: '', memberIds: [] });
        setSubmitting(false);
        setLocalError('');
    }, [isOpen]);

    const handleClose = () => {
        if (submitting) return;
        setLocalError('');
        onClose();
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const root = document.documentElement;
        const updateDarkMode = () => {
            setIsDarkMode(root.classList.contains('dark'));
        };

        updateDarkMode();

        const observer = new MutationObserver(() => updateDarkMode());
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleMemberChange = (options: readonly MemberSelectOption[] | null) => {
        const selectedIds = Array.isArray(options) ? options.map((option) => option.value) : [];
        setFormState((prev) => ({ ...prev, memberIds: selectedIds }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!formState.name.trim()) {
            const message = t('permissions.groups.create_modal.name_required');
            setLocalError(message);
            onError(message);
            return;
        }

        if (!formState.managerId) {
            const message = t('permissions.groups.create_modal.manager_required');
            setLocalError(message);
            onError(message);
            return;
        }

        setSubmitting(true);
        setLocalError('');

        try {
            await shopGroupApi.create({
                name: formState.name.trim(),
                description: formState.description.trim() ? formState.description.trim() : undefined,
                managerId: formState.managerId,
                memberIds: formState.memberIds,
            });

            const successMessage = t('permissions.groups.create_modal.success');
            await onSuccess(successMessage);
            handleClose();
        } catch (error: any) {
            console.error('Error creating shop group:', error);
            const message = error?.message || t('permissions.groups.create_modal.error');
            setLocalError(message);
            onError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} className="max-w-xl p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white vietnamese-text">
                        {t('permissions.groups.create_modal.title')}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 vietnamese-text">
                        {t('permissions.groups.create_modal.description')}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label>{t('permissions.groups.create_modal.name_label')}</Label>
                    <input
                        type="text"
                        value={formState.name}
                        onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder={t('permissions.groups.create_modal.name_placeholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        disabled={submitting}
                        required
                    />
                </div>

                <div>
                    <Label>{t('permissions.groups.create_modal.manager_label')}</Label>
                    {users.length === 0 ? (
                        <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                            {t('permissions.groups.create_modal.no_users')}
                        </div>
                    ) : (
                        <select
                            value={formState.managerId}
                            onChange={(event) => setFormState((prev) => ({ ...prev, managerId: event.target.value, memberIds: prev.memberIds.filter((id) => id !== event.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            disabled={submitting || users.length === 0}
                            required
                        >
                            <option value="">{t('permissions.groups.create_modal.manager_placeholder')}</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.username})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <Label>{t('permissions.groups.create_modal.members_label')}</Label>
                    {additionalMemberOptions.length === 0 ? (
                        <div className="py-2 text-sm text-gray-500 dark:text-gray-400 vietnamese-text">
                            {t('permissions.groups.create_modal.no_other_users')}
                        </div>
                    ) : (
                        <Select
                            isMulti
                            isDisabled={submitting}
                            options={memberSelectOptions}
                            value={selectedMemberOptions}
                            onChange={handleMemberChange}
                            placeholder={t('permissions.groups.create_modal.members_placeholder')}
                            classNamePrefix="react-select"
                            styles={{
                                ...selectStyles, container: (base) => ({
                                    ...base,
                                    zIndex: 99999
                                }), menuPortal: (base) => ({ ...base, zIndex: 99999 })
                            }}
                            menuPortalTarget={typeof window === 'undefined' ? undefined : document.body}
                        />
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 vietnamese-text">
                        {t('permissions.groups.create_modal.members_hint')}
                    </p>
                </div>

                <div>
                    <Label>{t('permissions.groups.create_modal.description_label')}</Label>
                    <textarea
                        value={formState.description}
                        onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder={t('permissions.groups.create_modal.description_placeholder')}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white h-24"
                        disabled={submitting}
                    />
                </div>

                {localError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                        {localError}
                    </div>
                )}

                <div className="flex space-x-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        className="flex-1"
                        disabled={submitting}
                    >
                        {t('common.cancel')}
                    </Button>
                    <LoadingButton
                        type="submit"
                        loading={submitting}
                        loadingText={t('permissions.groups.create_modal.loading')}
                        className="flex-1 bg-brand-500 hover:bg-brand-600 focus:ring-brand-500"
                        disabled={users.length === 0}
                    >
                        {t('permissions.groups.create_modal.submit')}
                    </LoadingButton>
                </div>
            </form>
        </Modal>
    );
};

export default CreateShopGroupModal;
