from src import webserver
from scripts.index_source_texts import path_for_output


def test_optional_dependency_defaults_are_checkout_relative() -> None:
    assert webserver.DEFAULT_AUGUSTINE_CORPUS_ROOT == (
        webserver.REPO_ROOT.parent / "AugustineCorpus"
    )
    assert webserver.DEFAULT_EXTERNAL_PSALMS_PATH == (
        webserver.REPO_ROOT.parent
        / "AugustineCorpus"
        / "texts"
        / "david_texts"
        / "Psalms.txt"
    )
    assert webserver.PERICOPEAI_ASSETS_PUBLIC_ROOT == (
        webserver.REPO_ROOT.parent / "pericopeai-assets" / "public"
    )


def test_external_source_index_paths_are_logical_not_machine_absolute(tmp_path) -> None:
    source_dir = tmp_path / "external-corpus"
    source_file = source_dir / "Wisdom.txt"

    assert path_for_output(source_file, source_dir) == "external/Wisdom.txt"
