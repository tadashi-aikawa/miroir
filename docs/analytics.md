Analytics
=========

差分があったリクエストのプロパティを解析し、その結果を表示します。


概要
----

Analyticsではプロパティの差分を**3つのグループに分類します**。

1. Ignored
2. Checked already
3. Attentions

![](./resources/analytics/summary.png)

`Count`は*条件に一致したTrialの数*を示しています。  
プロパティ差分の数ではありません。

**`Attentions!!`を常に空でキープすること** が品質保証の目標となります。

1つずつ見ていきます。


Ignored
-------

Ignoredに分類されるべき差分は、**確認が不要なもの**です。  
ここに分類されたものは、通常Miroirで確認する必要はありません。

### Ignoredに入る条件

Trialが`trials[].diffs_by_cognition`に`unknown`以外のキーを持つ場合、カウントされます。  
これは、Miroirに登録するレポートを作成するプロセス(Jumeauxなど)の時点で決定します。

```json
  "trials": [
    {
      "diffs_by_cognition": {
        "Ignore favorite only if path includes `/same`": {
          "added": ["root<'members'><2><'favorite'>"],
          "changed": ["root<'members'><1><'favorite'><0>"],
          "removed": ["root<'members'><1><'favorite'><1>"]
        },
        "Ignore ignored_id": {
          "added": [],
          "changed": ["root<'ignored_id'>"],
          "removed": []
        }
      },
```

上記のTrialによって、以下それぞれの項目が`+1`されます。

![](./resources/analytics/ignored.png)

?> `Ignore ignore_id`はCountが2なので、上記以外で該当するTrialが1つ存在します


Checked already
---------------

Checked alreadyに分類されるべき差分は、**既に把握しているが、確認が必要なもの**です。  
ここに分類されたものは、状況に応じてMiroirで確認する必要があります。

このグループの項目をどれだけ減らせるかが、確認作業の効率に直結します😄

### Checked alreadyに入る条件

Trialが[Check YAML]の条件にマッチした場合にカウントされます。  
これは、Miroirで確認しながら操作することで動的に変更できます。

詳しい仕様は[Check YAML]をご覧下さい。

[Check YAML]: checkyaml

!> [Check YAML]の設定はブラウザごとに保存されるため共有できません

### 網羅的な確認

Checked alreadyの確認を助けるバッチがあります。

![](./resources/analytics/checked_already.png)

このバッチは、*Checked alreadyに該当するTrialの数*を示しています。  
これをクリックすると、確認の必要がある結果のみを詳細ダイアログで確認できます。


Attentions!!
------------

**必ず確認しなければいけないヤバそうな奴ら**です💀

!> `Attentions!!`を無視する習慣がある場合、運用は破綻していると言えます

### Attentions!!に入る条件

`Attentions!!`に出現する条件は3つあり、それぞれが決まった項目で表示されます。

* Appears unknown!!
* No diff keys!!
* Both failure!!

?> これらの状況はTrial tableの見た目にも影響します。詳しくは [Trial table > レコード種別](trialtable?id=レコード種別)を参照してください

1つずつ詳しく見ていきましょう。

### Appears unknown!!

IgnoredとChecked alreadyに該当しない差分プロパティが1つでも存在する場合に分類されます。  
未知なる差分がある..という意味です😇

詳細ダイアログから差分を確認して、以下のような対応をしましょう。

|      差分の種類      |                   推奨する対応                    |
| -------------------- | ------------------------------------------------- |
| APIの不具合          | APIを修正する                                     |
| 必ず無視して良い差分 | Ignoredに分類されるよう設定を変更 ℹ️              |
| 都度確認と判断が必要 | Checked Alreadyに分類されるよう[Check YAML]を変更 |

?> ℹ️Jumeauxの場合は[judgement/ignoreアドオン](https://tadashi-aikawa.github.io/jumeaux/ja/addons/judgement/#ignore)の編集が必要

### No diff keys!!

解析するための差分プロパティが存在しない場合に分類されます。  
たとえば以下のようなケースです。

* jsonやxmlのような構造を持つレスポンスを返却していない
* jsonやxmlを返しているが、`type`がそれを認識していない

`type`が意図した形式になっているか確認してみてください。

![](./resources/analytics/type.png)


### Both failure!!

レスポンスは差分なしであるが、oneとotherのステータスが共に400以上である場合に分類されます。  
たとえば以下のようなケースです。

* テストケースが不正である
* APIサーバが正しく動作していない

いずれのケースもリグレッションテストとしては意味を成しません。  
テストケースやAPIの状態が妥当であるか確認しましょう。

!> 例外ケースとしては、不正なAPIリクエストに対して4xxエラーが返却することを確認したい場合が考えられます
