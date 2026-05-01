#!/bin/bash
# Fix corrupted deb file caused by Tauri's ar serializer when uid/gid > 999999

DEB_DIR="src-tauri/target/release/bundle/deb"
for DEB_BUILD in "$DEB_DIR"/*_amd64; do
  if [ -d "$DEB_BUILD" ]; then
    echo "Fixing corrupted DEB archive in $DEB_BUILD..."
    cd "$DEB_BUILD" || exit 1
    # System ar creates valid headers even for large UIDs
    ar rcs "fixed.deb" debian-binary control.tar.gz data.tar.gz
    mv "fixed.deb" "../$(basename "$DEB_BUILD").deb"
    cd - >/dev/null || exit 1
  fi
done

echo "All .deb packages patched successfully."
