import os
import pkg_resources
import subprocess


domain = "collective.volto.formsupport"
os.chdir(pkg_resources.resource_filename(domain, ""))
os.chdir("../../../../")
target_path = "src/collective/volto/formsupport/"
locale_path = target_path + "locales/"
i18ndude = "./bin/i18ndude"

# ignore node_modules files resulting in errors
excludes = '"*.html *json-schema*.xml"'


def locale_folder_setup():
    os.chdir(locale_path)
    languages = [d for d in os.listdir(".") if os.path.isdir(d)]
    for lang in languages:
        folder = os.listdir(lang)
        if "LC_MESSAGES" in folder:
            continue
        else:
            lc_messages_path = lang + "/LC_MESSAGES/"
            os.mkdir(lc_messages_path)
            cmd = "msginit --locale={} --input={}.pot --output={}/LC_MESSAGES/{}.po".format(  # NOQA: E501
                lang,
                domain,
                lang,
                domain,
            )
            subprocess.call(
                cmd,
                shell=True,
            )

    os.chdir("../../../../../")


def _rebuild():
    cmd = "{i18ndude} rebuild-pot --pot {locale_path}/{domain}.pot --exclude {excludes} --create {domain} {target_path}".format(  # NOQA: E501
        i18ndude=i18ndude,
        locale_path=locale_path,
        domain=domain,
        target_path=target_path,
        excludes=excludes,
    )
    subprocess.call(
        cmd,
        shell=True,
    )


def _sync():
    cmd = f"{i18ndude} sync --pot {locale_path}/{domain}.pot {locale_path}*/LC_MESSAGES/{domain}.po"
    subprocess.call(
        cmd,
        shell=True,
    )


def update_locale():
    locale_folder_setup()
    _sync()
    _rebuild()
