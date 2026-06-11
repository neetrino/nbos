# Credentials Favorites + Folder Grouping Plan

## Decision

Implement Favorites and Folders as separate concepts.

- Favorites are a personal quick-access preference.
- Folders are ordinary credential organization.
- Favorites are not folders and must not be deletable or renameable.
- Folder storage should support many-to-many now, while the v1 UI may expose only one ordinary folder per credential.

## Product Model

- `Category` answers: what business group is this credential in?
- `Credential Type` answers: what secret format is stored?
- `Access Level` answers: who can see or edit it?
- `Favorite` answers: does this employee want quick access to this credential?
- `Folder` answers: where is it convenient to organize this credential?

Favorites and folders never grant access. Existing credential visibility remains the source of truth.

## First Release Scope

- Add `CredentialFavorite` with unique `employeeId + credentialId`.
- Add `CredentialFolder` and `CredentialFolderMembership` for ordinary folders.
- Add favorite toggle API.
- Add `favoritesOnly` support to credential list API.
- Return `isFavorite` in list/detail responses for the current user.
- Return lightweight folder labels in list/detail responses.
- Add a Favorites quick filter available in List, Tiles, and Category Board.
- Add a Star action to credential cards and rows.

## UI Rules

- Filled star means favorite.
- Outline star means not favorite.
- Star click must not open the credential sheet.
- Favorites filter composes with the active tab:
  - `All` shows favorite credentials from all visible scopes.
  - `My`, `Team`, `Project`, and `Secret` show favorites inside that scope.
- Do not add a top-level Favorites tab.
- Do not show Favorites only inside Folder view.

## Later Scope

- Folder view mode.
- Create credential inside an active folder.
- ~~Bulk add/remove from folder.~~ ✅
- ~~Drag cards into folders.~~ ✅
- Folder picker in the credential sheet.
- Folder sharing/visibility if needed.
