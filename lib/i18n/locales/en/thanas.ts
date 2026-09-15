export const thanas = {
  title: "Thana Management",
  subtitle: "Configure locations for user profiles.",
  actions: {
    add: "Add Thana",
  },
  empty: "No thanas yet — add one above.",
  modal: {
    title: "Add New Thana",
    label: "Thana Name",
    placeholder: "e.g. Amberkhana",
    cancel: "Cancel",
    add: "Add Thana",
  },
  chip: {
    renameTitle: "Rename Thana",
    renamePreview: "Renaming from '{old}' to '{new}'",
    renameLabel: "Rename",
    deleteTitle: "Delete Thana",
    deleteConfirm: "Delete",
    checkingRefs: "Checking references...",
    refWarning: "{count} member profile(s) currently reference this thana. Their thana will be set to none. This cannot be undone.",
    noRefWarning: "No profile references this thana. This cannot be undone.",
    renameSuccess: "Thana renamed to \"{name}\".",
    deleteSuccess: "Thana \"{name}\" deleted.",
  },
  flash: {
    addSuccess: "Thana added successfully.",
  },
} as const;
