from collective.volto.formsupport.interfaces import IFormDataStore
from collective.volto.formsupport.restapi.services.form_data.form_data import FormData
from plone import api
from zope.component import getMultiAdapter
from zope.globalrequest import getRequest

import click
import sys
import transaction


@click.command(
    help="bin/instance -OPlone run bin/formsupport_data_cleansing [--dryrun|--no-dryrun]",
    context_settings=dict(
        ignore_unknown_options=True,
        allow_extra_args=True,
    ),
)
@click.option(
    "--dryrun/--no-dryrun",
    is_flag=True,
    default=True,
    help="--dryrun (default) simulate, --no-dryrun actually save the changes",
)
def main(dryrun):
    # import pdb;pdb.set_trace()
    if dryrun:
        print("CHECK ONLY")
    catalog = api.portal.get_tool("portal_catalog")
    root_path = "/".join(api.portal.get().getPhysicalPath())
    request = getRequest()
    if "blocks_type" in catalog.indexes():
        brains = catalog.unrestrictedSearchResults(block_types="form", path=root_path)
    else:
        print("[WARN] This script is optimized for plone.volto >= 4.1.0")
        brains = catalog.unrestrictedSearchResults(path=root_path)
    for brain in brains:
        obj = brain.getObject()
        blocks = getattr(obj, "blocks", None)
        if isinstance(blocks, dict):
            for block_id, block in blocks.items():
                if block.get("@type", "") != "form":
                    continue
                if not block.get("store", False):
                    continue
                remove_data_after_days = int(block.get("remove_data_after_days") or 0)
                # 0/None -> default value
                # -1 -> don't remove
                if remove_data_after_days <= 0:
                    print(
                        f"SKIP record cleanup from {brain.getPath()} block: {block_id}"
                    )
                    continue
                data = FormData(obj, request, block_id)
                store = getMultiAdapter((obj, request), IFormDataStore)
                deleted = 0
                for item in data.get_expired_items():
                    store.delete(item["id"])
                    deleted += 1
                if deleted:
                    print(
                        f"[INFO] removed {deleted} records from {brain.getPath()} block: {block_id}"
                    )
    if not dryrun:
        print("COMMIT")
        transaction.commit()


if __name__ == "__main__":
    sys.exit(main())
